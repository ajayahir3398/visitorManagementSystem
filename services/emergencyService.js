import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const EmergencyService = {
  raiseEmergency: async ({
    emergencyType,
    notificationType,
    description,
    location,
    unitId,
    reqUser,
  }) => {
    const societyId = reqUser.society_id;

    if (!emergencyType || !notificationType) {
      throw { status: 400, message: 'emergencyType and notificationType are required' };
    }

    await fixSequence('emergency_requests');

    const emergency = await prisma.emergencyRequest.create({
      data: {
        societyId,
        raisedBy: reqUser.id,
        unitId: unitId ? parseInt(unitId) : null,
        emergencyType,
        notificationType,
        description,
        location,
        status: 'OPEN',
        priority: 'HIGH',
      },
      include: {
        user: { select: { name: true, mobile: true } },
        unit: { select: { unitNo: true } },
      },
    });

    return emergency;
  },

  acknowledgeEmergency: async ({ emergencyId, reqUser: _reqUser }) => {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyId },
    });

    if (!emergency) throw { status: 404, message: 'Emergency request not found' };

    if (emergency.status !== 'OPEN') {
      throw { status: 400, message: `Emergency is already ${emergency.status}` };
    }

    const updatedEmergency = await prisma.emergencyRequest.update({
      where: { id: emergencyId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });

    return updatedEmergency;
  },

  addEmergencyResponse: async ({ emergencyId, responseAction, responseNotes, reqUser }) => {
    if (!responseAction) throw { status: 400, message: 'responseAction is required' };

    await fixSequence('emergency_responses');

    const response = await prisma.emergencyResponse.create({
      data: {
        emergencyId,
        responderId: reqUser.id,
        responseAction,
        responseNotes,
      },
    });

    return response;
  },

  resolveEmergency: async ({ emergencyId, reqUser: _reqUser }) => {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyId },
    });

    if (!emergency) throw { status: 404, message: 'Emergency request not found' };

    const updatedEmergency = await prisma.emergencyRequest.update({
      where: { id: emergencyId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    return updatedEmergency;
  },

  getEmergencies: async ({ status, page = 1, limit = 10, reqUser }) => {
    const societyId = reqUser.society_id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { societyId };
    if (status) where.status = status;

    if (reqUser.role_name === 'RESIDENT') {
      where.raisedBy = reqUser.id;
    }

    const [emergencies, total] = await Promise.all([
      prisma.emergencyRequest.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { raisedAt: 'desc' },
        include: {
          user: { select: { name: true, mobile: true } },
          unit: { select: { unitNo: true } },
          _count: { select: { responses: true } },
        },
      }),
      prisma.emergencyRequest.count({ where }),
    ]);

    return { emergencies, total, page: parseInt(page), limit: parseInt(limit) };
  },

  getEmergencyTimeline: async ({ emergencyId, reqUser }) => {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyId },
      include: {
        user: { select: { name: true, mobile: true } },
        unit: { select: { unitNo: true } },
        responses: {
          include: {
            responder: { select: { name: true, role: { select: { name: true } } } },
          },
          orderBy: { responseTime: 'asc' },
        },
      },
    });

    if (!emergency) throw { status: 404, message: 'Emergency request not found' };

    if (reqUser.role_name === 'RESIDENT' && emergency.raisedBy !== reqUser.id) {
      throw { status: 403, message: 'Access denied. You can only view emergencies you raised.' };
    }

    if (reqUser.society_id && emergency.societyId !== reqUser.society_id) {
      throw { status: 403, message: 'Access denied. This emergency belongs to another society.' };
    }

    return emergency;
  },
};
