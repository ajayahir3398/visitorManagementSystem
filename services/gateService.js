import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const GateService = {
  createGate: async ({ name, societyId, reqUser }) => {
    if (!name || !societyId) {
      throw { status: 400, message: 'Name and societyId are required' };
    }

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== parseInt(societyId)) {
      throw {
        status: 403,
        message: 'Access denied. You can only create gates for your own society.',
      };
    }

    const society = await prisma.society.findUnique({ where: { id: parseInt(societyId) } });
    if (!society) {
      throw { status: 404, message: 'Society not found' };
    }

    const existingGate = await prisma.gate.findFirst({
      where: { societyId: parseInt(societyId), name: name.trim() },
    });

    if (existingGate) {
      throw { status: 400, message: 'Gate with this name already exists for this society' };
    }

    await fixSequence('gates');

    const gate = await prisma.gate.create({
      data: {
        name: name.trim(),
        societyId: parseInt(societyId),
      },
      include: {
        society: { select: { id: true, name: true, type: true } },
      },
    });

    return gate;
  },

  getGates: async ({ page = 1, limit = 10, societyId, search, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (societyId) where.societyId = parseInt(societyId);
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }];

    if (
      (reqUser.role_name === 'SOCIETY_ADMIN' || reqUser.role_name === 'SECURITY') &&
      reqUser.society_id
    ) {
      where.societyId = reqUser.society_id;
    }

    const [gates, total] = await Promise.all([
      prisma.gate.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          society: { select: { id: true, name: true, type: true } },
          _count: { select: { visitorLogs: true } },
        },
      }),
      prisma.gate.count({ where }),
    ]);

    return { gates, total };
  },

  getGateById: async ({ gateId, reqUser }) => {
    if (isNaN(gateId)) throw { status: 400, message: 'Invalid gate ID' };

    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
      include: {
        society: { select: { id: true, name: true, type: true } },
        _count: { select: { visitorLogs: true } },
      },
    });

    if (!gate) throw { status: 404, message: 'Gate not found' };

    if (
      (reqUser.role_name === 'SOCIETY_ADMIN' || reqUser.role_name === 'SECURITY') &&
      reqUser.society_id !== gate.societyId
    ) {
      throw {
        status: 403,
        message: 'Access denied. You can only view gates from your own society.',
      };
    }

    return gate;
  },

  updateGate: async ({ gateId, name, reqUser }) => {
    if (isNaN(gateId)) throw { status: 400, message: 'Invalid gate ID' };

    const existingGate = await prisma.gate.findUnique({ where: { id: gateId } });
    if (!existingGate) throw { status: 404, message: 'Gate not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== existingGate.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only update gates from your own society.',
      };
    }

    if (name && name.trim() !== existingGate.name) {
      const duplicateGate = await prisma.gate.findFirst({
        where: { societyId: existingGate.societyId, name: name.trim(), id: { not: gateId } },
      });

      if (duplicateGate) {
        throw { status: 400, message: 'Gate with this name already exists for this society' };
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();

    const gate = await prisma.gate.update({
      where: { id: gateId },
      data: updateData,
      include: { society: { select: { id: true, name: true, type: true } } },
    });

    const changes = [];
    if (name && name.trim() !== existingGate.name) {
      changes.push(`name: "${existingGate.name}" → "${name.trim()}"`);
    }

    return { gate, changes };
  },

  deleteGate: async ({ gateId, reqUser }) => {
    if (isNaN(gateId)) throw { status: 400, message: 'Invalid gate ID' };

    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
      include: { _count: { select: { visitorLogs: true } } },
    });

    if (!gate) throw { status: 404, message: 'Gate not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== gate.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only delete gates from your own society.',
      };
    }

    if (gate._count.visitorLogs > 0) {
      throw {
        status: 400,
        message: 'Cannot delete gate with existing visitor logs. Please remove visitor logs first.',
      };
    }

    await prisma.gate.delete({ where: { id: gateId } });

    return gate;
  },
};
