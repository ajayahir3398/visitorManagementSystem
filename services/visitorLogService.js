import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';
import { normalizeBase64Image } from '../utils/image.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const VisitorLogService = {
  createEntry: async ({
    visitorId,
    name,
    mobile,
    gateId,
    unitId,
    flatNo,
    purpose,
    photoBase64,
    user,
  }) => {
    // Validate inputs
    if (!visitorId && (!name || !mobile)) {
      throw { status: 400, message: 'Either visitorId or both name and mobile are required' };
    }
    if (!gateId) {
      throw { status: 400, message: 'gateId is required' };
    }
    if (!unitId && !flatNo) {
      throw { status: 400, message: 'Either unitId or flatNo is required' };
    }

    // Security guard must have a society
    if (!user.society_id) {
      throw { status: 403, message: 'Security guard must be associated with a society' };
    }

    let actualVisitorId = visitorId;

    if (!actualVisitorId) {
      // Lookup or create visitor by mobile
      let visitor = await prisma.visitor.findFirst({
        where: { mobile: mobile },
      });

      let normalizedPhoto = null;
      if (photoBase64) {
        try {
          normalizedPhoto = normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
        } catch (error) {
          throw { status: 400, message: error.message || 'Invalid photo data' };
        }
      }

      if (visitor) {
        // Update name and photo if provided
        await prisma.visitor.update({
          where: { id: visitor.id },
          data: {
            name: name,
            ...(normalizedPhoto && { photoBase64: normalizedPhoto }),
          },
        });
        actualVisitorId = visitor.id;
      } else {
        // Create new visitor
        visitor = await prisma.visitor.create({
          data: {
            name,
            mobile,
            ...(normalizedPhoto && { photoBase64: normalizedPhoto }),
          },
        });
        actualVisitorId = visitor.id;
      }
    } else {
      // Visitor ID provided, just check if exists and optionally update photo
      const visitor = await prisma.visitor.findUnique({
        where: { id: parseInt(actualVisitorId) },
      });
      if (!visitor) {
        throw { status: 404, message: 'Visitor not found' };
      }

      if (photoBase64 !== undefined) {
        try {
          const normalizedPhoto =
            photoBase64 === null
              ? null
              : normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
          await prisma.visitor.update({
            where: { id: parseInt(actualVisitorId) },
            data: { photoBase64: normalizedPhoto },
          });
        } catch (error) {
          throw { status: 400, message: error.message || 'Invalid photo data' };
        }
      }
    }

    // Check gate
    const gate = await prisma.gate.findUnique({
      where: { id: parseInt(gateId) },
    });
    if (!gate) {
      throw { status: 404, message: 'Gate not found' };
    }
    if (gate.societyId !== user.society_id) {
      throw { status: 403, message: 'Gate does not belong to your society' };
    }

    // Check unit
    let unit = null;
    if (unitId) {
      unit = await prisma.unit.findUnique({
        where: { id: parseInt(unitId) },
      });
      if (!unit) {
        throw { status: 404, message: 'Unit not found' };
      }
      if (unit.societyId !== user.society_id) {
        throw { status: 403, message: 'Unit does not belong to your society' };
      }
    }

    // Check active entry
    const activeEntry = await prisma.visitorLog.findFirst({
      where: {
        visitorId: parseInt(actualVisitorId),
        societyId: user.society_id,
        status: { not: 'EXITED' },
        exitTime: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (activeEntry) {
      throw {
        status: 400,
        message: 'Visitor already has an active entry. Please mark exit first.',
        data: { visitorLog: activeEntry },
      };
    }

    await fixSequence('visitor_logs');

    // Create log
    const visitorLog = await prisma.visitorLog.create({
      data: {
        societyId: user.society_id,
        gateId: parseInt(gateId),
        visitorId: parseInt(actualVisitorId),
        unitId: unitId ? parseInt(unitId) : null,
        flatNo: flatNo || null,
        purpose: purpose || null,
        entryTime: null,
        status: 'PENDING',
        createdBy: user.id,
      },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        gate: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNo: true, unitType: true } },
      },
    });

    return visitorLog;
  },

  markExit: async ({ visitorLogId, exitTime, user }) => {
    if (isNaN(visitorLogId)) {
      throw { status: 400, message: 'Invalid visitor log ID' };
    }
    if (!user.society_id) {
      throw { status: 403, message: 'Security guard must be associated with a society' };
    }

    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        visitor: { select: { id: true, name: true, mobile: true } },
        gate: { select: { id: true, name: true } },
      },
    });

    if (!visitorLog) {
      throw { status: 404, message: 'Visitor log not found' };
    }
    if (visitorLog.societyId !== user.society_id) {
      throw {
        status: 403,
        message: 'Access denied. This visitor log does not belong to your society.',
      };
    }
    if (visitorLog.status === 'EXITED' || visitorLog.exitTime) {
      throw { status: 400, message: 'Visitor has already exited', data: { visitorLog } };
    }

    const updated = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: {
        exitTime: exitTime ? new Date(exitTime) : new Date(),
        status: 'EXITED',
      },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        gate: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        createdByUser: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
      },
    });

    return updated;
  },

  getLogs: async ({
    page = 1,
    limit = 10,
    status,
    gateId,
    visitorId,
    flatNo,
    date,
    search,
    user,
  }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (user.role_name === 'SECURITY' || user.role_name === 'SOCIETY_ADMIN') {
      if (user.society_id) where.societyId = user.society_id;
    }

    if (user.role_name === 'RESIDENT') {
      if (user.society_id) where.societyId = user.society_id;

      const userUnits = await prisma.unitMember.findMany({
        where: { userId: user.id },
        select: { unitId: true },
      });
      const unitIds = userUnits.map((um) => um.unitId);

      if (unitIds.length === 0) {
        return { visitorLogs: [], total: 0 };
      }
      where.unitId = { in: unitIds };
    }

    if (status) where.status = status;
    if (gateId) where.gateId = parseInt(gateId);
    if (visitorId) where.visitorId = parseInt(visitorId);

    if (flatNo) {
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: [{ flatNo }, { unit: { unitNo: flatNo } }] }];
        delete where.OR;
      } else {
        where.OR = [{ flatNo }, { unit: { unitNo: flatNo } }];
      }
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    if (search) {
      where.OR = [
        { flatNo: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { unit: { unitNo: { contains: search, mode: 'insensitive' } } },
        {
          visitor: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search } },
            ],
          },
        },
      ];
    }

    const [visitorLogs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
          gate: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNo: true, unitType: true } },
          createdByUser: { select: { id: true, name: true } },
          society: { select: { id: true, name: true } },
          _count: { select: { approvals: true } },
        },
      }),
      prisma.visitorLog.count({ where }),
    ]);

    return { visitorLogs, total };
  },

  getLogById: async ({ visitorLogId, user }) => {
    if (isNaN(visitorLogId)) {
      throw { status: 400, message: 'Invalid visitor log ID' };
    }

    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        gate: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        createdByUser: { select: { id: true, name: true } },
        society: { select: { id: true, name: true } },
        approvals: {
          include: { resident: { select: { id: true, name: true, mobile: true } } },
          orderBy: { decisionTime: 'desc' },
        },
      },
    });

    if (!visitorLog) {
      throw { status: 404, message: 'Visitor log not found' };
    }

    if (user.role_name === 'SECURITY' || user.role_name === 'SOCIETY_ADMIN') {
      if (user.society_id !== visitorLog.societyId) {
        throw {
          status: 403,
          message: 'Access denied. This visitor log does not belong to your society.',
        };
      }
    }

    if (user.role_name === 'RESIDENT') {
      if (user.society_id !== visitorLog.societyId) {
        throw {
          status: 403,
          message: 'Access denied. This visitor log does not belong to your society.',
        };
      }
      if (visitorLog.unitId) {
        const isMember = await prisma.unitMember.findFirst({
          where: { unitId: visitorLog.unitId, userId: user.id },
        });
        if (!isMember) {
          throw {
            status: 403,
            message: 'Access denied. You can only view visitor logs for your units.',
          };
        }
      } else {
        if (visitorLog.flatNo) {
          const userUnits = await prisma.unitMember.findMany({
            where: { userId: user.id },
            include: { unit: { select: { unitNo: true } } },
          });
          const hasMatchingUnit = userUnits.some(
            (um) => um.unit.unitNo.toLowerCase() === visitorLog.flatNo?.toLowerCase()
          );
          if (!hasMatchingUnit) {
            throw {
              status: 403,
              message: 'Access denied. You can only view visitor logs for your units.',
            };
          }
        } else {
          throw {
            status: 403,
            message: 'Access denied. Visitor log does not have a valid unit or flat number.',
          };
        }
      }
    }

    return visitorLog;
  },

  getActiveEntries: async ({ page = 1, limit = 10, gateId, user }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: { not: 'EXITED' }, exitTime: null };

    if (user.role_name === 'SECURITY' || user.role_name === 'SOCIETY_ADMIN') {
      if (user.society_id) where.societyId = user.society_id;
    }
    if (gateId) where.gateId = parseInt(gateId);

    const [visitorLogs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { entryTime: 'desc' },
        include: {
          visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
          gate: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNo: true, unitType: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      }),
      prisma.visitorLog.count({ where }),
    ]);

    return { visitorLogs, total };
  },
};
