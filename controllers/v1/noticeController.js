import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Create a new notice
 * POST /api/v1/notices
 * Access: SOCIETY_ADMIN only
 */
export const createNotice = async (req, res) => {
    try {
        const {
            title,
            description,
            noticeType,
            priority,
            audience,
            startDate,
            endDate,
            attachmentUrl
        } = req.body;

        const societyId = req.user.society_id;
        const userId = req.user.id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        await fixSequence('notices');

        const notice = await prisma.notice.create({
            data: {
                societyId: parseInt(societyId),
                createdBy: userId,
                title,
                description,
                noticeType,
                priority: priority || 'Medium',
                audience,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                attachmentUrl,
                isActive: true,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.NOTICE_CREATED,
            entity: AUDIT_ENTITIES.NOTICE,
            entityId: notice.id,
            description: `Notice created: ${notice.title}`,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: { notice },
        });
    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notice',
            error: error.message,
        });
    }
};

/**
 * Get all active notices for the society
 * GET /api/v1/notices
 * Access: All authenticated users (scoped to society and audience)
 */
export const getNotices = async (req, res) => {
    try {
        const societyId = req.user.society_id;
        const role = req.user.role_name;
        const now = new Date();

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        const where = {
            societyId: parseInt(societyId),
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            OR: [
                { audience: 'All' },
                { audience: role === 'SECURITY' ? 'Security' : 'Residents' },
            ],
        };

        // Owners and Tenants are both Residents in the audience context usually
        if (role === 'SOCIETY_ADMIN') {
            // Admin can see everything for their society, regardless of audience filter or date (maybe they want to see scheduled?)
            // But the prompt says "Active" notices. Let's stick to active for now.
            delete where.OR; // Allow admin to see all audiences
        } else if (role === 'RESIDENT') {
            // We could refine Resident into Owner/Tenant if audience supports it
            where.OR = [
                { audience: 'All' },
                { audience: 'Residents' },
                // Add owner/tenant specific if needed
            ];
        }

        const notices = await prisma.notice.findMany({
            where,
            include: {
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                // unit: true // Assuming unit relation exists on user if needed, otherwise name is good
                            }
                        }
                    }
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Map to include isRead flag and read details
        const formattedNotices = notices.map(notice => {
            const isRead = notice.reads.some(r => r.userId === req.user.id);
            return {
                ...notice,
                isRead,
                readCount: notice.reads.length,
                readByUsers: notice.reads.map(r => r.user), // List of users who read it
                reads: undefined, // specific reads array can be removed or kept based on preference, cleaning it up
            };
        });

        res.json({
            success: true,
            message: 'Notices retrieved successfully',
            data: { notices: formattedNotices },
        });
    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notices',
            error: error.message,
        });
    }
};

/**
 * Get notice by ID
 * GET /api/v1/notices/:id
 * Access: Scoped to society
 */
export const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const noticeId = parseInt(id);
        const societyId = req.user.society_id;

        if (!societyId) {
            return res.status(400).json({
                success: false,
                message: 'User is not associated with a society',
            });
        }

        const notice = await prisma.notice.findFirst({
            where: {
                id: noticeId,
                societyId: parseInt(societyId),
            },
            include: {
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                },
            },
        });

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found',
            });
        }

        const isRead = notice.reads.some(r => r.userId === req.user.id);

        res.json({
            success: true,
            data: {
                ...notice,
                isRead,
                readCount: notice.reads.length,
                readByUsers: notice.reads.map(r => r.user),
                reads: undefined,
            },
        });
    } catch (error) {
        console.error('Get notice by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notice',
            error: error.message,
        });
    }
};

/**
 * Mark notice as read
 * POST /api/v1/notices/:id/read
 */
export const markNoticeRead = async (req, res) => {
    try {
        const { id } = req.params;
        const noticeId = parseInt(id);
        const userId = req.user.id;

        await fixSequence('notice_reads');

        await prisma.noticeRead.upsert({
            where: {
                noticeId_userId: {
                    noticeId,
                    userId,
                },
            },
            update: {},
            create: {
                noticeId,
                userId,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.NOTICE_READ,
            entity: AUDIT_ENTITIES.NOTICE,
            entityId: noticeId,
            description: `Notice ${noticeId} marked as read`,
            req
        });

        res.json({
            success: true,
            message: 'Notice marked as read',
        });
    } catch (error) {
        console.error('Mark notice read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notice as read',
            error: error.message,
        });
    }
};

/**
 * Update notice
 * PUT /api/v1/notices/:id
 * Access: SOCIETY_ADMIN only
 */
export const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const noticeId = parseInt(id);
        const societyId = req.user.society_id;

        const notice = await prisma.notice.updateMany({
            where: {
                id: noticeId,
                societyId: parseInt(societyId),
            },
            data: req.body,
        });

        if (notice.count === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found or no permission',
            });
        }

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.NOTICE_UPDATED,
            entity: AUDIT_ENTITIES.NOTICE,
            entityId: noticeId,
            description: `Notice ${noticeId} updated`,
            req,
        });

        res.json({
            success: true,
            message: 'Notice updated successfully',
        });
    } catch (error) {
        console.error('Update notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notice',
            error: error.message,
        });
    }
};

/**
 * Deactivate notice (Soft delete)
 * DELETE /api/v1/notices/:id
 * Access: SOCIETY_ADMIN only
 */
export const deactivateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const noticeId = parseInt(id);
        const societyId = req.user.society_id;

        await prisma.notice.updateMany({
            where: {
                id: noticeId,
                societyId: parseInt(societyId),
            },
            data: { isActive: false },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.NOTICE_DEACTIVATED,
            entity: AUDIT_ENTITIES.NOTICE,
            entityId: noticeId,
            description: `Notice ${noticeId} deactivated`,
            req,
        });

        res.json({
            success: true,
            message: 'Notice deactivated successfully',
        });
    } catch (error) {
        console.error('Deactivate notice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate notice',
            error: error.message,
        });
    }
};
