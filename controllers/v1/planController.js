import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';

/**
 * Get all available subscription plans (Public)
 * GET /api/v1/plans
 * Access: Public (no authentication required)
 */
export const getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { 
        isActive: true,
        code: { not: null }, // Only return plans with code
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

    res.json({
      success: true,
      message: 'Plans retrieved successfully',
      data: { plans },
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plans',
      error: error.message,
    });
  }
};

/**
 * Get plan by ID (Public)
 * GET /api/v1/plans/:id
 * Access: Public
 */
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID',
      });
    }

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

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    res.json({
      success: true,
      message: 'Plan retrieved successfully',
      data: { plan },
    });
  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plan',
      error: error.message,
    });
  }
};

/**
 * Create a new subscription plan
 * POST /api/v1/plans
 * Access: SUPER_ADMIN only
 */
export const createPlan = async (req, res) => {
  try {
    const { code, name, price, durationMonths, billingCycle, visitorLimit, features, isActive } = req.body;

    // Validation
    if (!code || !name || price === undefined || !durationMonths || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, name, price, durationMonths, billingCycle',
      });
    }

    if (price < 0 || durationMonths < 1) {
      return res.status(400).json({
        success: false,
        message: 'Price must be >= 0 and durationMonths must be >= 1',
      });
    }

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

    // Log action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.CREATED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION_PLAN,
      entityId: plan.id,
      description: `Created subscription plan: ${plan.name} (${plan.code})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: { plan },
    });
  } catch (error) {
    console.error('Create plan error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Plan with this code already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create plan',
      error: error.message,
    });
  }
};

/**
 * Update a subscription plan
 * PUT /api/v1/plans/:id
 * Access: SUPER_ADMIN only
 */
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, durationMonths, billingCycle, visitorLimit, features, isActive } = req.body;

    const planId = parseInt(id);
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID',
      });
    }

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseInt(price);
    if (durationMonths !== undefined) updateData.durationMonths = parseInt(durationMonths);
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (visitorLimit !== undefined) updateData.visitorLimit = visitorLimit ? parseInt(visitorLimit) : null;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    // Log action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION_PLAN,
      entityId: updatedPlan.id,
      description: `Updated subscription plan: ${updatedPlan.name} (${updatedPlan.code})`,
      req,
    });

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: { plan: updatedPlan },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan',
      error: error.message,
    });
  }
};

/**
 * Disable/Enable a subscription plan
 * POST /api/v1/plans/:id/toggle
 * Access: SUPER_ADMIN only
 */
export const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id);

    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID',
      });
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: !existingPlan.isActive },
    });

    // Log action
    await logAction({
      user: req.user,
      action: updatedPlan.isActive ? AUDIT_ACTIONS.ACTIVATED : AUDIT_ACTIONS.DEACTIVATED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION_PLAN,
      entityId: updatedPlan.id,
      description: `${updatedPlan.isActive ? 'Activated' : 'Deactivated'} subscription plan: ${updatedPlan.name} (${updatedPlan.code})`,
      req,
    });

    res.json({
      success: true,
      message: `Plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { plan: updatedPlan },
    });
  } catch (error) {
    console.error('Toggle plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle plan status',
      error: error.message,
    });
  }
};

/**
 * Get all plans (including inactive) - Super Admin
 * GET /api/v1/plans/all
 * Access: SUPER_ADMIN only
 */
export const getAllPlans = async (req, res) => {
  try {
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
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'All plans retrieved successfully',
      data: { plans },
    });
  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plans',
      error: error.message,
    });
  }
};

