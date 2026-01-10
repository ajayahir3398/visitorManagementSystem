import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Report a rule violation
 * POST /api/v1/violations
 * Access: SOCIETY_ADMIN, SECURITY (Maybe RESIDENT too?)
 */
export const reportViolation = async (req, res) => {
    try {
        const { ruleId, violatorUserId, violatorUnitId, description, proofImage, penaltyAmount } = req.body;
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        // Check if rule exists
        const rule = await prisma.rule.findFirst({
            where: { id: parseInt(ruleId), societyId: parseInt(societyId) }
        });

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        // Fix sequence
        await fixSequence('rule_violations');

        const violation = await prisma.ruleViolation.create({
            data: {
                societyId: parseInt(societyId),
                ruleId: parseInt(ruleId),
                violatorUserId: violatorUserId ? parseInt(violatorUserId) : null,
                violatorUnitId: violatorUnitId ? parseInt(violatorUnitId) : null,
                reportedByUserId: req.user.id,
                description,
                proofImage,
                penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : null,
                status: 'PENDING',
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.VIOLATION_REPORTED,
            entity: AUDIT_ENTITIES.RULE_VIOLATION,
            entityId: violation.id,
            description: `Violation reported for rule "${rule.title}"`,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Violation reported successfully',
            data: { violation },
        });
    } catch (error) {
        console.error('Report violation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report violation',
            error: error.message,
        });
    }
};

/**
 * Get violations
 * GET /api/v1/violations
 * Access: SOCIETY_ADMIN (all), RESIDENT (own)
 */
export const getViolations = async (req, res) => {
    try {
        const { status, unitId } = req.query;
        const societyId = req.user.society_id;
        const userId = req.user.id;
        const role = req.user.role_name;

        const where = {
            societyId: parseInt(societyId),
        };

        // If resident, only show own violations
        if (role === 'RESIDENT') {
            where.violatorUserId = userId;
        }

        if (status) {
            where.status = status;
        }

        if (unitId) {
            where.violatorUnitId = parseInt(unitId);
        }

        const violations = await prisma.ruleViolation.findMany({
            where,
            include: {
                rule: {
                    select: { title: true, category: true, priority: true }
                },
                violator: {
                    select: { name: true, mobile: true, email: true }
                },
                unit: {
                    select: { unitNo: true, block: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            message: 'Violations retrieved successfully',
            data: { violations },
        });
    } catch (error) {
        console.error('Get violations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve violations',
            error: error.message,
        });
    }
};

/**
 * Update violation status
 * PUT /api/v1/violations/:id/status
 * Access: SOCIETY_ADMIN
 */
export const updateViolationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, penaltyAmount } = req.body;
        const societyId = req.user.society_id;

        if (!['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const violation = await prisma.ruleViolation.findFirst({
            where: { id: parseInt(id), societyId: parseInt(societyId) },
            include: { rule: true }
        });

        if (!violation) {
            return res.status(404).json({
                success: false,
                message: 'Violation not found',
            });
        }

        const updatedViolation = await prisma.ruleViolation.update({
            where: { id: parseInt(id) },
            data: {
                status,
                penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : undefined,
            },
        });

        await logAction({
            user: req.user,
            action: status === 'RESOLVED' ? AUDIT_ACTIONS.VIOLATION_RESOLVED : AUDIT_ACTIONS.VIOLATION_UPDATED,
            entity: AUDIT_ENTITIES.RULE_VIOLATION,
            entityId: violation.id,
            description: `Violation status updated to ${status}`,
            req,
        });

        res.json({
            success: true,
            message: 'Violation status updated successfully',
            data: { violation: updatedViolation },
        });
    } catch (error) {
        console.error('Update violation status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update violation status',
            error: error.message,
        });
    }
};
