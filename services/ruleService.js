import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const RuleService = {
  createRule: async ({ title, description, category, priority, violationPenalty, reqUser }) => {
    const societyId = reqUser.society_id;

    if (!societyId) {
      throw { status: 400, message: 'User is not associated with a society' };
    }

    await fixSequence('rules');

    const rule = await prisma.rule.create({
      data: {
        societyId: parseInt(societyId),
        title,
        description,
        category,
        priority: priority ? priority.toString().toUpperCase() : 'MEDIUM',
        violationPenalty,
        createdBy: reqUser.id,
        isActive: true,
      },
    });

    return rule;
  },

  getRuleNotificationUsers: async (societyId) => {
    const users = await prisma.user.findMany({
      where: {
        societyId: parseInt(societyId),
        status: 'ACTIVE',
        role: { name: { in: ['RESIDENT', 'SECURITY'] } },
      },
      select: { id: true },
    });

    return users.map((u) => u.id);
  },

  getRules: async ({ category, isActive, reqUser }) => {
    const societyId = reqUser.society_id;

    if (!societyId) {
      throw { status: 400, message: 'User is not associated with a society' };
    }

    const where = { societyId: parseInt(societyId) };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await prisma.rule.findMany({
      where,
      orderBy: { priority: 'desc' },
    });

    return rules;
  },

  getRuleById: async ({ ruleId, reqUser }) => {
    if (isNaN(ruleId)) throw { status: 400, message: 'Invalid rule ID' };

    const societyId = reqUser.society_id;

    const rule = await prisma.rule.findFirst({
      where: { id: ruleId, societyId: parseInt(societyId) },
    });

    if (!rule) throw { status: 404, message: 'Rule not found' };

    return rule;
  },

  updateRule: async ({ ruleId, updateData, reqUser }) => {
    if (isNaN(ruleId)) throw { status: 400, message: 'Invalid rule ID' };

    const societyId = reqUser.society_id;

    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, societyId: parseInt(societyId) },
    });

    if (!existingRule) throw { status: 404, message: 'Rule not found' };

    if (updateData.priority) updateData.priority = updateData.priority.toString().toUpperCase();

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: updateData,
    });

    return rule;
  },

  deleteRule: async ({ ruleId, reqUser }) => {
    if (isNaN(ruleId)) throw { status: 400, message: 'Invalid rule ID' };

    const societyId = reqUser.society_id;

    const existingRule = await prisma.rule.findFirst({
      where: { id: ruleId, societyId: parseInt(societyId) },
    });

    if (!existingRule) throw { status: 404, message: 'Rule not found' };

    const rule = await prisma.rule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });

    return rule;
  },
};
