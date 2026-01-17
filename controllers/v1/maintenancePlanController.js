import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Create a new maintenance plan for the society
 * POST /api/v1/maintenance-plans
 * Access: SOCIETY_ADMIN
 */
export const createMaintenancePlan = async (req, res) => {
    try {
        const { planType, amount } = req.body;
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        // Validate planType
        if (!['MONTHLY', 'YEARLY'].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Plan type must be MONTHLY or YEARLY',
            });
        }

        // Check if plan already exists for this society and type
        const existingPlan = await prisma.societyMaintenancePlan.findUnique({
            where: {
                societyId_planType: {
                    societyId: parseInt(societyId),
                    planType,
                },
            },
        });

        if (existingPlan) {
            return res.status(409).json({
                success: false,
                message: `A ${planType} maintenance plan already exists for this society. Use update instead.`,
            });
        }

        // Fix sequence if needed
        await fixSequence('society_maintenance_plans');

        const plan = await prisma.societyMaintenancePlan.create({
            data: {
                societyId: parseInt(societyId),
                planType,
                amount: parseInt(amount),
                isActive: true,
            },
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
    } catch (error) {
        console.error('Create maintenance plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create maintenance plan',
            error: error.message,
        });
    }
};

/**
 * Get all maintenance plans for the society
 * GET /api/v1/maintenance-plans
 * Access: SOCIETY_ADMIN, RESIDENT
 */
export const getMaintenancePlans = async (req, res) => {
    try {
        const { isActive } = req.query;
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        const where = {
            societyId: parseInt(societyId),
        };

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const plans = await prisma.societyMaintenancePlan.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            message: 'Maintenance plans retrieved successfully',
            data: { plans },
        });
    } catch (error) {
        console.error('Get maintenance plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve maintenance plans',
            error: error.message,
        });
    }
};

/**
 * Get maintenance plan by ID
 * GET /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN, RESIDENT
 */
export const getMaintenancePlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const planId = parseInt(id);
        const societyId = req.user.society_id;

        if (isNaN(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID',
            });
        }

        const plan = await prisma.societyMaintenancePlan.findFirst({
            where: {
                id: planId,
                societyId: parseInt(societyId),
            },
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance plan not found',
            });
        }

        res.json({
            success: true,
            message: 'Maintenance plan retrieved successfully',
            data: { plan },
        });
    } catch (error) {
        console.error('Get maintenance plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve maintenance plan',
            error: error.message,
        });
    }
};

/**
 * Update maintenance plan
 * PUT /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN
 */
export const updateMaintenancePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const planId = parseInt(id);
        const { amount, isActive } = req.body;
        const societyId = req.user.society_id;

        if (isNaN(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID',
            });
        }

        // Check if plan exists and belongs to society
        const existingPlan = await prisma.societyMaintenancePlan.findFirst({
            where: {
                id: planId,
                societyId: parseInt(societyId),
            },
        });

        if (!existingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance plan not found',
            });
        }

        const updateData = {};
        if (amount !== undefined) updateData.amount = parseInt(amount);
        if (isActive !== undefined) updateData.isActive = isActive;

        const plan = await prisma.societyMaintenancePlan.update({
            where: { id: planId },
            data: updateData,
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
    } catch (error) {
        console.error('Update maintenance plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance plan',
            error: error.message,
        });
    }
};

/**
 * Delete maintenance plan (Soft delete by setting isActive to false)
 * DELETE /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN
 */
export const deleteMaintenancePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const planId = parseInt(id);
        const societyId = req.user.society_id;

        if (isNaN(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID',
            });
        }

        // Check if plan exists and belongs to society
        const existingPlan = await prisma.societyMaintenancePlan.findFirst({
            where: {
                id: planId,
                societyId: parseInt(societyId),
            },
        });

        if (!existingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance plan not found',
            });
        }

        // Soft delete by setting isActive to false
        const plan = await prisma.societyMaintenancePlan.update({
            where: { id: planId },
            data: {
                isActive: false,
            },
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
    } catch (error) {
        console.error('Delete maintenance plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate maintenance plan',
            error: error.message,
        });
    }
};
