import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';
import { normalizeBase64Image } from '../utils/image.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const VisitorService = {
  createVisitor: async ({ name, mobile, photoBase64 }) => {
    if (!name || !mobile) {
      throw { status: 400, message: 'Name and mobile are required' };
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      throw { status: 400, message: 'Mobile must be 10 digits' };
    }

    let normalizedPhoto = null;
    if (photoBase64 !== undefined) {
      try {
        normalizedPhoto =
          photoBase64 === null
            ? null
            : normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
      } catch (error) {
        throw { status: 400, message: error.message || 'Invalid photo data' };
      }
    }

    const existingVisitor = await prisma.visitor.findFirst({
      where: { mobile },
    });

    if (existingVisitor) {
      return { visitor: existingVisitor, isExisting: true };
    }

    await fixSequence('visitors');

    const visitor = await prisma.visitor.create({
      data: {
        name: name.trim(),
        mobile,
        photoBase64: normalizedPhoto,
      },
    });

    return { visitor, isExisting: false };
  },

  getVisitors: async ({ page = 1, limit = 10, search, mobile, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
    }

    if (mobile) {
      where.mobile = mobile;
    }

    if (reqUser.role_name === 'RESIDENT') {
      const visitorLogs = await prisma.visitorLog.findMany({
        where: { societyId: reqUser.society_id },
        select: { visitorId: true },
        distinct: ['visitorId'],
      });

      const visitorIds = visitorLogs.map((log) => log.visitorId);

      if (visitorIds.length === 0) {
        return { visitors: [], total: 0 };
      }

      where.id = { in: visitorIds };
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { visitorLogs: true } },
        },
      }),
      prisma.visitor.count({ where }),
    ]);

    return { visitors, total };
  },

  getVisitorById: async ({ visitorId, reqUser }) => {
    if (isNaN(visitorId)) throw { status: 400, message: 'Invalid visitor ID' };

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      include: {
        _count: { select: { visitorLogs: true } },
      },
    });

    if (!visitor) throw { status: 404, message: 'Visitor not found' };

    if (reqUser.role_name === 'RESIDENT') {
      const hasVisitedSociety = await prisma.visitorLog.findFirst({
        where: { visitorId: visitorId, societyId: reqUser.society_id },
      });

      if (!hasVisitedSociety) {
        throw {
          status: 403,
          message: 'Access denied. You can only view visitors who have visited your society.',
        };
      }
    }

    return visitor;
  },

  updateVisitor: async ({ visitorId, name, mobile, photoBase64 }) => {
    if (isNaN(visitorId)) throw { status: 400, message: 'Invalid visitor ID' };

    const existingVisitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!existingVisitor) throw { status: 404, message: 'Visitor not found' };

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      throw { status: 400, message: 'Mobile must be 10 digits' };
    }

    if (mobile && mobile !== existingVisitor.mobile) {
      const mobileExists = await prisma.visitor.findFirst({ where: { mobile } });
      if (mobileExists)
        throw { status: 400, message: 'Visitor with this mobile number already exists' };
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (mobile) updateData.mobile = mobile;
    if (photoBase64 !== undefined) {
      try {
        updateData.photoBase64 =
          photoBase64 === null
            ? null
            : normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
      } catch (error) {
        throw { status: 400, message: error.message || 'Invalid photo data' };
      }
    }

    const visitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: updateData,
    });

    const changes = [];
    if (name && name.trim() !== existingVisitor.name)
      changes.push(`name: "${existingVisitor.name}" → "${name.trim()}"`);
    if (mobile && mobile !== existingVisitor.mobile)
      changes.push(`mobile: "${existingVisitor.mobile}" → "${mobile}"`);
    if (photoBase64 !== undefined && updateData.photoBase64 !== existingVisitor.photoBase64)
      changes.push('photo updated');

    return { visitor, changes };
  },

  deleteVisitor: async ({ visitorId }) => {
    if (isNaN(visitorId)) throw { status: 400, message: 'Invalid visitor ID' };

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      include: {
        _count: { select: { visitorLogs: true } },
      },
    });

    if (!visitor) throw { status: 404, message: 'Visitor not found' };

    if (visitor._count.visitorLogs > 0) {
      throw {
        status: 400,
        message:
          'Cannot delete visitor with existing visitor logs. Please remove visitor logs first.',
      };
    }

    await prisma.visitor.delete({
      where: { id: visitorId },
    });

    return visitor;
  },

  searchVisitors: async ({ q, limit = 20, reqUser }) => {
    if (!q || q.trim().length < 2) {
      throw { status: 400, message: 'Search query must be at least 2 characters' };
    }

    const searchQuery = q.trim();
    const where = {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { mobile: { contains: searchQuery } },
      ],
    };

    if (reqUser.role_name === 'RESIDENT') {
      const visitorLogs = await prisma.visitorLog.findMany({
        where: { societyId: reqUser.society_id },
        select: { visitorId: true },
        distinct: ['visitorId'],
      });

      const visitorIds = visitorLogs.map((log) => log.visitorId);

      if (visitorIds.length === 0) {
        return [];
      }

      where.id = { in: visitorIds };
    }

    const visitors = await prisma.visitor.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, mobile: true, photoBase64: true, createdAt: true },
    });

    return visitors;
  },
};
