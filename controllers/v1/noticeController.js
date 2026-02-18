import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';

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

        // Send Push Notification
        try {
            // Determine target users based on audience
            let whereClause = {
                societyId: parseInt(societyId),
                status: 'active'
            };

            if (audience === 'Security') {
                whereClause.role = { name: 'SECURITY' };
            } else if (audience === 'Residents' || audience === 'Owners' || audience === 'Tenants') {
                // For simplified logic, 'Residents' targets all residents (Owners + Tenants)
                // If more granular targeting is needed (e.g. specifically Owners), we need to query UnitMember
                // Current simplified approach: Send to all RESIDENT role users in society
                // Refinement: If 'Owners', only send to users who are strictly OWNERS in at least one unit?
                // For now, let's keep it robust:
                if (audience === 'Owners') {
                    // Finds users who are primary/member of a unit with role OWNER
                    // This complex query is better handled by first finding UserIds from UnitMember
                    const ownerMembers = await prisma.unitMember.findMany({
                        where: {
                            unit: { societyId: parseInt(societyId) },
                            role: 'OWNER'
                        },
                        select: { userId: true }
                    });
                    const ownerIds = ownerMembers.map(m => m.userId);
                    whereClause.id = { in: ownerIds };
                } else if (audience === 'Tenants') {
                    const tenantMembers = await prisma.unitMember.findMany({
                        where: {
                            unit: { societyId: parseInt(societyId) },
                            role: 'TENANT'
                        },
                        select: { userId: true }
                    });
                    const tenantIds = tenantMembers.map(m => m.userId);
                    whereClause.id = { in: tenantIds };
                } else {
                    // Residents (All)
                    whereClause.role = { name: 'RESIDENT' };
                }
            } else {
                // 'All' - includes SECURITY, RESIDENT, SOCIETY_ADMIN, etc.
                // No extra filter needed on role
            }

            // Exclude the creator from notification? Optional.
            // whereClause.id = { not: userId }; 

            const users = await prisma.user.findMany({
                where: whereClause,
                select: { id: true }
            });

            const userIds = users.map(u => u.id);

            if (userIds.length > 0) {
                console.log(`🔔 Sending notice notification to ${userIds.length} users (Audience: ${audience})`);
                sendNotificationToUsers(
                    userIds,
                    `New Notice: ${title}`,
                    description.length > 50 ? description.substring(0, 47) + '...' : description,
                    {
                        type: 'notice',
                        id: notice.id.toString(),
                        screen: 'notice_detail'
                    }
                ); // Async, don't await to block response
            }

        } catch (notifError) {
            console.error('Error sending notice notifications:', notifError);
            // Don't fail the request
        }

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
        const userId = req.user.id;
        const { isRead } = req.query;
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
        };

        // Audience filtering
        if (role === 'SOCIETY_ADMIN') {
            // Admin can see everything
        } else if (role === 'SECURITY') {
            where.OR = [
                { audience: 'All' },
                { audience: 'Security' },
            ];
        } else if (role === 'RESIDENT') {
            // Get user's unit member role to refine audience
            const unitMember = await prisma.unitMember.findFirst({
                where: { userId },
                select: { role: true }
            });

            const specificAudience = unitMember?.role === 'OWNER' ? 'Owners' :
                unitMember?.role === 'TENANT' ? 'Tenants' : null;

            where.OR = [
                { audience: 'All' },
                { audience: 'Residents' },
            ];

            if (specificAudience) {
                where.OR.push({ audience: specificAudience });
            }
        }

        // Filter by Read Status
        if (isRead !== undefined) {
            const readStatus = isRead === 'true';
            if (readStatus) {
                where.reads = { some: { userId } };
            } else {
                where.reads = { none: { userId } };
            }
        }

        const notices = await prisma.notice.findMany({
            where,
            include: {
                _count: {
                    select: { reads: true }
                },
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        // Map to standard response format
        const formattedNotices = notices.map(notice => {
            const isRead = notice.reads.some(r => r.userId === userId);
            const otherReads = notice.reads.filter(r => r.userId !== userId);

            return {
                ...notice,
                isRead,
                readCount: otherReads.length,
                readByUser: otherReads.map(r => r.user),
                _count: undefined,
                reads: undefined,
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
        const userId = req.user.id;

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
                _count: {
                    select: { reads: true }
                },
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
        });

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found',
            });
        }

        const isRead = notice.reads.some(r => r.userId === userId);
        const otherReads = notice.reads.filter(r => r.userId !== userId);

        res.json({
            success: true,
            data: {
                ...notice,
                isRead,
                readCount: otherReads.length,
                readByUser: otherReads.map(r => r.user),
                _count: undefined,
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
