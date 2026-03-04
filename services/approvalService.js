import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';
import { sendNotificationToUser } from '../utils/notificationHelper.js';

export const ApprovalService = {
  processApproval: async ({ visitorLogId, reqUser, decision }) => {
    if (isNaN(visitorLogId)) {
      throw { status: 400, message: 'Invalid visitor log ID' };
    }

    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        unit: { select: { id: true, unitNo: true } },
        visitor: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!visitorLog) throw { status: 404, message: 'Visitor log not found' };

    if (reqUser.society_id !== visitorLog.societyId) {
      throw {
        status: 403,
        message: 'Access denied. This visitor log does not belong to your society.',
      };
    }

    if (visitorLog.unitId) {
      const isMember = await prisma.unitMember.findFirst({
        where: { unitId: visitorLog.unitId, userId: reqUser.id },
      });
      if (!isMember) {
        throw {
          status: 403,
          message: `Access denied. You can only ${decision} visitors for your units.`,
        };
      }
    } else if (visitorLog.flatNo) {
      const userUnits = await prisma.unitMember.findMany({
        where: { userId: reqUser.id },
        include: { unit: { select: { unitNo: true } } },
      });
      const hasMatchingUnit = userUnits.some(
        (um) => um.unit.unitNo.toLowerCase() === visitorLog.flatNo?.toLowerCase()
      );
      if (!hasMatchingUnit) {
        throw {
          status: 403,
          message: `Access denied. You can only ${decision} visitors for your units.`,
        };
      }
    } else {
      throw { status: 400, message: 'Visitor log does not have a valid unit or flat number.' };
    }

    if (visitorLog.status === 'APPROVED') {
      throw { status: 400, message: 'Visitor entry is already approved', data: { visitorLog } };
    }
    if (visitorLog.status === 'REJECTED') {
      throw { status: 400, message: 'Visitor entry is already rejected', data: { visitorLog } };
    }
    if (visitorLog.status === 'EXITED') {
      throw {
        status: 400,
        message: `Visitor has already exited. Cannot ${decision}.`,
        data: { visitorLog },
      };
    }

    const existingApproval = await prisma.approval.findFirst({
      where: { visitorLogId: visitorLogId, residentId: reqUser.id },
    });

    let approval;
    let updatedLog;

    if (existingApproval) {
      approval = await prisma.approval.update({
        where: { id: existingApproval.id },
        data: { decision, decisionTime: new Date() },
        include: { resident: { select: { id: true, name: true, mobile: true } } },
      });

      updatedLog = await prisma.visitorLog.update({
        where: { id: visitorLogId },
        data: {
          status: decision,
          ...(decision === 'APPROVED' ? { entryTime: visitorLog.entryTime || new Date() } : {}),
        },
        include: {
          visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
          unit: { select: { id: true, unitNo: true, unitType: true } },
          gate: { select: { id: true, name: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      });
    } else {
      await fixSequence('approvals');
      approval = await prisma.approval.create({
        data: { visitorLogId, residentId: reqUser.id, decision, decisionTime: new Date() },
        include: { resident: { select: { id: true, name: true, mobile: true } } },
      });

      updatedLog = await prisma.visitorLog.update({
        where: { id: visitorLogId },
        data: {
          status: decision,
          ...(decision === 'APPROVED' ? { entryTime: new Date() } : {}),
        },
        include: {
          visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
          unit: { select: { id: true, unitNo: true, unitType: true } },
          gate: { select: { id: true, name: true } },
          approvals: {
            include: { resident: { select: { id: true, name: true, mobile: true } } },
            orderBy: { decisionTime: 'desc' },
          },
          createdByUser: { select: { id: true, name: true } },
        },
      });
    }

    try {
      const visitorName = updatedLog.visitor?.name || 'Visitor';
      const unitNo = updatedLog.unit?.unitNo || 'unit';
      const residentName = reqUser.name || 'Resident';
      const securityUserId = updatedLog.createdBy;

      const title = decision === 'APPROVED' ? 'Visitor Approved' : 'Visitor Rejected';
      const body = `${residentName} ${decision} ${visitorName} for ${unitNo}`;

      await sendNotificationToUser(securityUserId, title, body, {
        screen: 'visitor_log_detail',
        visitorLogId: visitorLogId.toString(),
        type: `visitor_${decision}`,
      });
    } catch (error) {
      console.error(`Error sending ${decision} notification:`, error);
    }

    return { approval, updatedLog, visitorLog };
  },

  getPendingApprovals: async ({ page = 1, limit = 10, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const userUnits = await prisma.unitMember.findMany({
      where: { userId: reqUser.id },
      select: { unitId: true, unit: { select: { unitNo: true } } },
    });

    const unitIds = userUnits.map((um) => um.unitId);

    if (unitIds.length === 0) {
      return { visitorLogs: [], total: 0 };
    }

    const where = {
      societyId: reqUser.society_id,
      status: 'PENDING',
      unitId: { in: unitIds },
    };

    const [visitorLogs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
          unit: { select: { id: true, unitNo: true, unitType: true } },
          gate: { select: { id: true, name: true } },
          createdByUser: { select: { id: true, name: true } },
          _count: { select: { approvals: true } },
        },
      }),
      prisma.visitorLog.count({ where }),
    ]);

    return { visitorLogs, total };
  },
};
