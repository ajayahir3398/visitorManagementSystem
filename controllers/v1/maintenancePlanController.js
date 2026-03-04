import { MaintenancePlanService } from '../../services/maintenancePlanService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createMaintenancePlan = asyncHandler(async (req, res) => {
  const { planType, amount } = req.body;
  const plan = await MaintenancePlanService.createMaintenancePlan({
    planType,
    amount,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.MAINTENANCE_PLAN_CREATED,
    entity: AUDIT_ENTITIES.MAINTENANCE_PLAN,
    entityId: plan.id,
    description: `Maintenance plan ${planType} created with amount ₹${amount}`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Maintenance plan created successfully',
    data: { plan },
  });
});

export const getMaintenancePlans = asyncHandler(async (req, res) => {
  const plans = await MaintenancePlanService.getMaintenancePlans({
    isActive: req.query.isActive,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Maintenance plans retrieved successfully',
    data: { plans },
  });
});

export const getMaintenancePlanById = asyncHandler(async (req, res) => {
  const plan = await MaintenancePlanService.getMaintenancePlanById({
    planId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Maintenance plan retrieved successfully',
    data: { plan },
  });
});

export const updateMaintenancePlan = asyncHandler(async (req, res) => {
  const plan = await MaintenancePlanService.updateMaintenancePlan({
    planId: parseInt(req.params.id),
    amount: req.body.amount,
    isActive: req.body.isActive,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.MAINTENANCE_PLAN_UPDATED,
    entity: AUDIT_ENTITIES.MAINTENANCE_PLAN,
    entityId: plan.id,
    description: `Maintenance plan ${plan.planType} updated`,
    req,
  });

  res.json({
    success: true,
    message: 'Maintenance plan updated successfully',
    data: { plan },
  });
});

export const deleteMaintenancePlan = asyncHandler(async (req, res) => {
  const plan = await MaintenancePlanService.deleteMaintenancePlan({
    planId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.MAINTENANCE_PLAN_DEACTIVATED,
    entity: AUDIT_ENTITIES.MAINTENANCE_PLAN,
    entityId: plan.id,
    description: `Maintenance plan ${plan.planType} deactivated`,
    req,
  });

  res.json({
    success: true,
    message: 'Maintenance plan deactivated successfully',
  });
});
