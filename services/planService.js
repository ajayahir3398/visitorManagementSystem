import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const PlanService = {
  getPlans: async () => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        code: { not: null },
      },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        durationMonths: true,
        billingCycle: true,
        visitorLimit: true,
        features: true,
      },
      orderBy: { price: 'asc' },
    });

    return plans;
  },

  getPlanById: async (planId) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        durationMonths: true,
        billingCycle: true,
        visitorLimit: true,
        features: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!plan) throw { status: 404, message: 'Plan not found' };

    return plan;
  },

  createPlan: async ({
    code,
    name,
    price,
    durationMonths,
    billingCycle,
    visitorLimit,
    features,
    isActive,
  }) => {
    if (!code || !name || price === undefined || !durationMonths || !billingCycle) {
      throw {
        status: 400,
        message: 'Missing required fields: code, name, price, durationMonths, billingCycle',
      };
    }

    if (price < 0 || durationMonths < 1) {
      throw { status: 400, message: 'Price must be >= 0 and durationMonths must be >= 1' };
    }

    await fixSequence('subscription_plans');

    try {
      const plan = await prisma.subscriptionPlan.create({
        data: {
          code,
          name,
          price: parseInt(price),
          durationMonths: parseInt(durationMonths),
          billingCycle,
          visitorLimit: visitorLimit ? parseInt(visitorLimit) : null,
          features: features || {},
          isActive: isActive !== undefined ? isActive : true,
        },
      });
      return plan;
    } catch (error) {
      if (error.code === 'P2002') {
        throw { status: 409, message: 'Plan with this code already exists' };
      }
      throw error;
    }
  },

  updatePlan: async (
    planId,
    { name, price, durationMonths, billingCycle, visitorLimit, features, isActive }
  ) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) throw { status: 404, message: 'Plan not found' };

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseInt(price);
    if (durationMonths !== undefined) updateData.durationMonths = parseInt(durationMonths);
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (visitorLimit !== undefined)
      updateData.visitorLimit = visitorLimit ? parseInt(visitorLimit) : null;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return updatedPlan;
  },

  togglePlanStatus: async (planId) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) throw { status: 404, message: 'Plan not found' };

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: !existingPlan.isActive },
    });

    return updatedPlan;
  },

  getAllPlans: async () => {
    const plans = await prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        durationMonths: true,
        billingCycle: true,
        visitorLimit: true,
        features: true,
        isActive: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans;
  },

  deletePlan: async (planId) => {
    if (isNaN(planId)) throw { status: 400, message: 'Invalid plan ID' };

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) throw { status: 404, message: 'Plan not found' };

    try {
      const deletedPlan = await prisma.subscriptionPlan.delete({
        where: { id: planId },
      });
      return deletedPlan;
    } catch (error) {
      if (error.code === 'P2003') {
        throw {
          status: 400,
          message: 'Cannot delete plan as it is associated with existing subscriptions',
        };
      }
      throw error;
    }
  },
};
