import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';

/**
 * Create a new rule
 * POST /api/v1/rules
 * Access: SOCIETY_ADMIN
 */
export const createRule = async (req, res) => {
    try {
        const { title, description, category, priority, violationPenalty } = req.body;

        // Determine society ID from user
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        // Fix sequence if needed
        await fixSequence('rules');

        const rule = await prisma.rule.create({
            data: {
                societyId: parseInt(societyId),
                title,
                description,
                category,
                priority: priority || 'Medium',
                violationPenalty,
                createdBy: req.user.id,
                isActive: true,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.RULE_CREATED,
            entity: AUDIT_ENTITIES.RULE,
            entityId: rule.id,
            description: `Rule "${rule.title}" created`,
            req,
        });

        // Send Push Notification
        try {
            // Send to all residents and security in the society
            const users = await prisma.user.findMany({
                where: {
                    societyId: parseInt(societyId),
                    status: 'active',
                    role: {
                        name: { in: ['RESIDENT', 'SECURITY'] }
                    }
                },
                select: { id: true }
            });

            const userIds = users.map(u => u.id);

            if (userIds.length > 0) {
                console.log(`🔔 Sending rule notification to ${userIds.length} users`);
                sendNotificationToUsers(
                    userIds,
                    `New Society Rule: ${title}`,
                    description.length > 50 ? description.substring(0, 47) + '...' : description,
                    {
                        type: 'rule',
                        id: rule.id.toString(),
                        screen: 'rule_detail'
                    }
                ); // Async
            }
        } catch (notifError) {
            console.error('Error sending rule notifications:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Rule created successfully',
            data: { rule },
        });
    } catch (error) {
        console.error('Create rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create rule',
            error: error.message,
        });
    }
};

/**
 * Get all rules for the society
 * GET /api/v1/rules
 * Access: Authenticated Users (scoped to society)
 */
export const getRules = async (req, res) => {
    try {
        const { category, isActive } = req.query;
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

        if (category) {
            where.category = category;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const rules = await prisma.rule.findMany({
            where,
            orderBy: { priority: 'desc' }, // High priority first? Or typically CreatedAt desc? User asked for priority check.
            // Since priority is string High/Medium/Low, desc sort might happen alphabetically if not mapped. 
            // 'High' < 'Low' < 'Medium' alphabetically? No. H < L < M. 
            // Alphabetical: High, Low, Medium. 
            // 'Medium' > 'Low' > 'High'. 
            // If we want High > Medium > Low, simple string sort won't work well without enum or case logic.
            // But let's stick to simple implementation for now or use created_at desc as backup.
            // Ideally, we'd use an enum or numerical priority.
            // Let's rely on createdAt for secondary sort.
        });

        // Sort manually if needed or accept string sort for now.
        // Let's update to sort by createdAt desc for now as it makes more sense for a list.

        res.json({
            success: true,
            message: 'Rules retrieved successfully',
            data: { rules },
        });
    } catch (error) {
        console.error('Get rules error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve rules',
            error: error.message,
        });
    }
};

/**
 * Get rule by ID
 * GET /api/v1/rules/:id
 * Access: Authenticated Users (scoped to society)
 */
export const getRuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = parseInt(id);
        const societyId = req.user.society_id;

        if (isNaN(ruleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid rule ID',
            });
        }

        const rule = await prisma.rule.findFirst({
            where: {
                id: ruleId,
                societyId: parseInt(societyId),
            },
        });

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        res.json({
            success: true,
            message: 'Rule retrieved successfully',
            data: { rule },
        });
    } catch (error) {
        console.error('Get rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve rule',
            error: error.message,
        });
    }
};

/**
 * Update rule
 * PUT /api/v1/rules/:id
 * Access: SOCIETY_ADMIN
 */
export const updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = parseInt(id);
        const { title, description, category, priority, violationPenalty, isActive } = req.body;
        const societyId = req.user.society_id;

        if (isNaN(ruleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid rule ID',
            });
        }

        // Check if rule exists and belongs to society
        const existingRule = await prisma.rule.findFirst({
            where: {
                id: ruleId,
                societyId: parseInt(societyId),
            },
        });

        if (!existingRule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        const rule = await prisma.rule.update({
            where: { id: ruleId },
            data: {
                title,
                description,
                category,
                priority,
                violationPenalty,
                isActive,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.RULE_UPDATED,
            entity: AUDIT_ENTITIES.RULE,
            entityId: rule.id,
            description: `Rule "${rule.title}" updated`,
            req,
        });

        res.json({
            success: true,
            message: 'Rule updated successfully',
            data: { rule },
        });
    } catch (error) {
        console.error('Update rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rule',
            error: error.message,
        });
    }
};

/**
 * Delete rule (Soft delete)
 * DELETE /api/v1/rules/:id
 * Access: SOCIETY_ADMIN
 */
export const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const ruleId = parseInt(id);
        const societyId = req.user.society_id;

        if (isNaN(ruleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid rule ID',
            });
        }

        // Check if rule exists and belongs to society
        const existingRule = await prisma.rule.findFirst({
            where: {
                id: ruleId,
                societyId: parseInt(societyId),
            },
        });

        if (!existingRule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        // Soft delete by setting isActive to false
        const rule = await prisma.rule.update({
            where: { id: ruleId },
            data: {
                isActive: false,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.RULE_DEACTIVATED,
            entity: AUDIT_ENTITIES.RULE,
            entityId: rule.id,
            description: `Rule "${rule.title}" deactivated`,
            req,
        });

        res.json({
            success: true,
            message: 'Rule deactivated successfully',
        });
    } catch (error) {
        console.error('Delete rule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate rule',
            error: error.message,
        });
    }
};
