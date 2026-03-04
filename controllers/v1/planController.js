import { PlanService } from '../../services/planService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await PlanService.getPlans();
  res.json({
    success: true,
    message: 'Plans retrieved successfully',
    data: { plans },
  });
});

export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await PlanService.getPlanById(parseInt(req.params.id));
  res.json({
    success: true,
    message: 'Plan retrieved successfully',
    data: { plan },
  });
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await PlanService.createPlan(req.body);

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
});

export const updatePlan = asyncHandler(async (req, res) => {
  const planId = parseInt(req.params.id);
  const updatedPlan = await PlanService.updatePlan(planId, req.body);

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
});

export const togglePlanStatus = asyncHandler(async (req, res) => {
  const planId = parseInt(req.params.id);
  const updatedPlan = await PlanService.togglePlanStatus(planId);

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
});

export const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await PlanService.getAllPlans();
  res.json({
    success: true,
    message: 'All plans retrieved successfully',
    data: { plans },
  });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const planId = parseInt(req.params.id);
  const deletedPlan = await PlanService.deletePlan(planId);

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETED,
    entity: AUDIT_ENTITIES.SUBSCRIPTION_PLAN,
    entityId: planId,
    description: `Deleted subscription plan: ${deletedPlan.name} (${deletedPlan.code})`,
    req,
  });

  res.json({
    success: true,
    message: 'Plan deleted successfully',
    data: { plan: deletedPlan },
  });
});
