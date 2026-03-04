import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const MaintenancePlanService = {
  createMaintenancePlan: async ({ planType, amount, reqUser }) => {
    const societyId = reqUser.society_id;

    if (!societyId) {
      throw { status: 400, message: 'User is not associated with a society' };
    }

    if (!['MONTHLY', 'YEARLY'].includes(planType)) {
      throw { status: 400, message: 'Plan type must be MONTHLY or YEARLY' };
    }

    const existingPlan = await prisma.societyMaintenancePlan.findUnique({
      where: {
        societyId_planType: {
          societyId: parseInt(societyId),
          planType,
        },
      },
    });

    if (existingPlan) {
      throw {
        status: 409,
        message: `A ${planType} maintenance plan already exists for this society. Use update instead.`,
      };
    }

    await fixSequence('society_maintenance_plans');

    const plan = await prisma.societyMaintenancePlan.create({
      data: {
        societyId: parseInt(societyId),
        planType,
        amount: parseInt(amount),
        isActive: true,
      },
    });

    return plan;
  },

  getMaintenancePlans: async ({ isActive, reqUser }) => {
    const societyId = reqUser.society_id;

    if (!societyId) {
      throw { status: 400, message: 'User is not associated with a society' };
    }

    const where = { societyId: parseInt(societyId) };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const plans = await prisma.societyMaintenancePlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return plans;
  },

  getMaintenancePlanById: async ({ planId, reqUser }) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const societyId = reqUser.society_id;

    const plan = await prisma.societyMaintenancePlan.findFirst({
      where: {
        id: planId,
        societyId: parseInt(societyId),
      },
    });

    if (!plan) throw { status: 404, message: 'Maintenance plan not found' };

    return plan;
  },

  updateMaintenancePlan: async ({ planId, amount, isActive, reqUser }) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const societyId = reqUser.society_id;

    const existingPlan = await prisma.societyMaintenancePlan.findFirst({
      where: {
        id: planId,
        societyId: parseInt(societyId),
      },
    });

    if (!existingPlan) throw { status: 404, message: 'Maintenance plan not found' };

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseInt(amount);
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.societyMaintenancePlan.update({
      where: { id: planId },
      data: updateData,
    });

    return plan;
  },

  deleteMaintenancePlan: async ({ planId, reqUser }) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const societyId = reqUser.society_id;

    const existingPlan = await prisma.societyMaintenancePlan.findFirst({
      where: {
        id: planId,
        societyId: parseInt(societyId),
      },
    });

    if (!existingPlan) throw { status: 404, message: 'Maintenance plan not found' };

    const plan = await prisma.societyMaintenancePlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    return plan;
  },
};
