import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const UnitService = {
  createUnit: async ({ unitNo, unitType, societyId, status, floor, block, reqUser }) => {
    if (!unitNo || !societyId || !block) {
      throw { status: 400, message: 'unitNo, societyId, and block are required' };
    }

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== parseInt(societyId)) {
      throw {
        status: 403,
        message: 'Access denied. You can only create units for your own society.',
      };
    }

    const society = await prisma.society.findUnique({ where: { id: parseInt(societyId) } });
    if (!society) {
      throw { status: 404, message: 'Society not found' };
    }

    const existingUnit = await prisma.unit.findFirst({
      where: { societyId: parseInt(societyId), unitNo: unitNo.trim(), block: block || null },
    });

    if (existingUnit) {
      throw { status: 400, message: 'Unit with this number already exists for this society' };
    }

    await fixSequence('units');

    try {
      const unit = await prisma.unit.create({
        data: {
          unitNo: unitNo.trim(),
          unitType: unitType ? unitType.toUpperCase() : null,
          societyId: parseInt(societyId),
          floor: floor ? parseInt(floor) : null,
          block: block || null,
          status: status ? status.toUpperCase() : 'ACTIVE',
        },
        include: {
          society: { select: { id: true, name: true, type: true } },
          _count: { select: { members: true, visitorLogs: true } },
        },
      });
      return unit;
    } catch (error) {
      if (
        error.code === 'P2002' &&
        error.meta?.modelName === 'Unit' &&
        (error.message?.includes('id') || error.message?.includes('Unique constraint'))
      ) {
        await fixSequence('units');
        const retryUnit = await prisma.unit.create({
          data: {
            unitNo: unitNo.trim(),
            unitType: unitType ? unitType.toUpperCase() : null,
            societyId: parseInt(societyId),
            floor: floor ? parseInt(floor) : null,
            block: block || null,
            status: status ? status.toUpperCase() : 'ACTIVE',
          },
          include: {
            society: { select: { id: true, name: true, type: true } },
            _count: { select: { members: true, visitorLogs: true } },
          },
        });
        return retryUnit;
      }
      throw error;
    }
  },

  getUnits: async ({ page = 1, limit = 10, societyId, status, unitType, search, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (societyId) where.societyId = parseInt(societyId);
    if (status) where.status = status;
    if (unitType) where.unitType = unitType;
    if (search) where.OR = [{ unitNo: { contains: search, mode: 'insensitive' } }];

    if (
      ['SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'].includes(reqUser.role_name) &&
      reqUser.society_id
    ) {
      where.societyId = reqUser.society_id;
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { unitNo: 'asc' },
        include: {
          society: { select: { id: true, name: true, type: true } },
          _count: { select: { members: true, visitorLogs: true } },
        },
      }),
      prisma.unit.count({ where }),
    ]);

    return { units, total };
  },

  getUnitById: async ({ unitId, reqUser }) => {
    if (isNaN(unitId)) throw { status: 400, message: 'Invalid unit ID' };

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        society: { select: { id: true, name: true, type: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: { select: { name: true } },
              },
            },
          },
        },
        _count: { select: { visitorLogs: true } },
      },
    });

    if (!unit) throw { status: 404, message: 'Unit not found' };

    if (
      ['SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'].includes(reqUser.role_name) &&
      reqUser.society_id !== unit.societyId
    ) {
      throw {
        status: 403,
        message: 'Access denied. You can only view units from your own society.',
      };
    }

    return unit;
  },

  updateUnit: async ({ unitId, unitNo, unitType, status, floor, block, reqUser }) => {
    if (isNaN(unitId)) throw { status: 400, message: 'Invalid unit ID' };

    const existingUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!existingUnit) throw { status: 404, message: 'Unit not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== existingUnit.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only update units from your own society.',
      };
    }

    if (unitNo && unitNo.trim() !== existingUnit.unitNo) {
      const duplicateUnit = await prisma.unit.findFirst({
        where: {
          societyId: existingUnit.societyId,
          unitNo: unitNo.trim(),
          block: block !== undefined ? block : existingUnit.block,
          id: { not: unitId },
        },
      });

      if (duplicateUnit) {
        throw {
          status: 400,
          message: 'Unit with this number and block already exists for this society',
        };
      }
    }

    const updateData = {};
    if (unitNo) updateData.unitNo = unitNo.trim();
    if (unitType !== undefined) updateData.unitType = unitType ? unitType.toUpperCase() : null;
    if (floor !== undefined) updateData.floor = floor ? parseInt(floor) : null;
    if (block !== undefined) updateData.block = block;
    if (status) updateData.status = status.toUpperCase();

    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: updateData,
      include: {
        society: { select: { id: true, name: true, type: true } },
        _count: { select: { members: true, visitorLogs: true } },
      },
    });

    const changes = [];
    if (unitNo && unitNo.trim() !== existingUnit.unitNo)
      changes.push(`unitNo: "${existingUnit.unitNo}" → "${unitNo.trim()}"`);
    if (unitType !== undefined && unitType !== existingUnit.unitType)
      changes.push(
        `unitType: "${existingUnit.unitType || 'N/A'}" → "${unitType ? unitType.toUpperCase() : 'N/A'}"`
      );
    if (floor !== undefined && floor !== existingUnit.floor)
      changes.push(`floor: "${existingUnit.floor || 'N/A'}" → "${floor || 'N/A'}"`);
    if (block !== undefined && block !== existingUnit.block)
      changes.push(`block: "${existingUnit.block || 'N/A'}" → "${block || 'N/A'}"`);
    if (status && status.toUpperCase() !== existingUnit.status)
      changes.push(`status: "${existingUnit.status}" → "${status.toUpperCase()}"`);

    return { unit, changes };
  },

  deleteUnit: async ({ unitId, reqUser }) => {
    if (isNaN(unitId)) throw { status: 400, message: 'Invalid unit ID' };

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { _count: { select: { members: true, visitorLogs: true } } },
    });

    if (!unit) throw { status: 404, message: 'Unit not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== unit.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only delete units from your own society.',
      };
    }

    if (unit._count.members > 0 || unit._count.visitorLogs > 0) {
      throw {
        status: 400,
        message:
          'Cannot delete unit with existing members or visitor logs. Please remove them first.',
      };
    }

    await prisma.unit.delete({ where: { id: unitId } });
    return unit;
  },

  addUnitMember: async ({ unitId, userId, role, isPrimary, reqUser }) => {
    if (isNaN(unitId)) throw { status: 400, message: 'Invalid unit ID' };
    if (!userId || !role) throw { status: 400, message: 'userId and role are required' };

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw { status: 404, message: 'Unit not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== unit.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only manage units from your own society.',
      };
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) throw { status: 404, message: 'User not found' };

    const existingMember = await prisma.unitMember.findUnique({
      where: { unitId_userId: { unitId, userId: parseInt(userId) } },
    });

    if (existingMember) {
      throw { status: 400, message: 'User is already a member of this unit' };
    }

    if (isPrimary) {
      await prisma.unitMember.updateMany({
        where: { unitId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    await fixSequence('unit_members');
    const member = await prisma.unitMember.create({
      data: {
        unitId,
        userId: parseInt(userId),
        role: role.toUpperCase(),
        isPrimary: isPrimary || false,
      },
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        unit: { select: { id: true, unitNo: true } },
      },
    });

    return { member, unit };
  },

  removeUnitMember: async ({ unitId, memberId, reqUser }) => {
    const memberIdInt = parseInt(memberId);
    if (isNaN(unitId) || isNaN(memberIdInt))
      throw { status: 400, message: 'Invalid unit ID or member ID' };

    const member = await prisma.unitMember.findUnique({
      where: { id: memberIdInt },
      include: { unit: true, user: { select: { id: true, name: true } } },
    });

    if (!member) throw { status: 404, message: 'Member not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== member.unit.societyId) {
      throw {
        status: 403,
        message: 'Access denied. You can only manage units from your own society.',
      };
    }

    await prisma.unitMember.delete({ where: { id: memberIdInt } });

    return member;
  },

  bulkDeleteUnits: async ({ unitIds, reqUser }) => {
    if (reqUser.role_name !== 'SOCIETY_ADMIN') {
      throw { status: 403, message: 'Access denied. Only Society Admins can delete units.' };
    }

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      throw { status: 400, message: 'unitIds array is required and must not be empty' };
    }

    const count = await prisma.unit.count({
      where: { id: { in: unitIds }, societyId: reqUser.society_id },
    });

    if (count !== unitIds.length) {
      throw {
        status: 400,
        message: 'One or more units not found or do not belong to your society',
      };
    }

    const result = await prisma.unit.deleteMany({
      where: { id: { in: unitIds }, societyId: reqUser.society_id },
    });

    return result.count;
  },
};
