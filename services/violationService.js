import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const ViolationService = {
  reportViolation: async ({
    ruleId,
    violatorUserId,
    violatorUnitId,
    description,
    photoBase64,
    penaltyAmount,
    reqUser,
  }) => {
    const societyId = reqUser.society_id;

    if (!societyId) {
      throw { status: 400, message: 'User is not associated with a society' };
    }

    const rule = await prisma.rule.findFirst({
      where: { id: parseInt(ruleId), societyId: parseInt(societyId) },
    });

    if (!rule) {
      throw { status: 404, message: 'Rule not found' };
    }

    await fixSequence('rule_violations');

    const violation = await prisma.ruleViolation.create({
      data: {
        societyId: parseInt(societyId),
        ruleId: parseInt(ruleId),
        violatorUserId: violatorUserId ? parseInt(violatorUserId) : null,
        violatorUnitId: violatorUnitId ? parseInt(violatorUnitId) : null,
        reportedByUserId: reqUser.id,
        description,
        photoBase64,
        penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : null,
        status: 'PENDING',
      },
    });

    return { violation, rule };
  },

  getViolations: async ({ status, unitId, reqUser }) => {
    const societyId = reqUser.society_id;
    const userId = reqUser.id;
    const role = reqUser.role_name;

    const where = { societyId: parseInt(societyId) };

    if (role === 'RESIDENT') {
      const unitMemberships = await prisma.unitMember.findMany({
        where: { userId },
        select: { unitId: true },
      });
      const unitIds = unitMemberships.map((um) => um.unitId);

      where.OR = [{ violatorUserId: userId }, { violatorUnitId: { in: unitIds } }];
    }

    if (status) where.status = status;
    if (unitId) where.violatorUnitId = parseInt(unitId);

    const violations = await prisma.ruleViolation.findMany({
      where,
      include: {
        rule: { select: { title: true, category: true, priority: true } },
        violator: { select: { name: true, mobile: true, email: true } },
        unit: { select: { unitNo: true, block: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return violations;
  },

  updateViolationStatus: async ({ violationId, status, penaltyAmount, reqUser }) => {
    const societyId = reqUser.society_id;

    if (!['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'].includes(status)) {
      throw { status: 400, message: 'Invalid status' };
    }

    const violation = await prisma.ruleViolation.findFirst({
      where: { id: parseInt(violationId), societyId: parseInt(societyId) },
      include: { rule: true },
    });

    if (!violation) {
      throw { status: 404, message: 'Violation not found' };
    }

    const updatedViolation = await prisma.ruleViolation.update({
      where: { id: parseInt(violationId) },
      data: {
        status,
        penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined,
      },
    });

    return updatedViolation;
  },
};
