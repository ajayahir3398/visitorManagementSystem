import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Raise Emergency
 * POST /api/v1/emergencies
 * Access: RESIDENT, SECURITY, SOCIETY_ADMIN
 */
export const raiseEmergency = async (req, res) => {
    try {
        const { emergencyType, notificationType, description, location, unitId } = req.body;
        const societyId = req.user.society_id;

        if (!emergencyType || !notificationType) {
            return res.status(400).json({
                success: false,
                message: 'emergencyType and notificationType are required',
            });
        }

        await fixSequence('emergency_requests');

        const emergency = await prisma.emergencyRequest.create({
            data: {
                societyId,
                raisedBy: req.user.id,
                unitId: unitId ? parseInt(unitId) : null,
                emergencyType,
                notificationType,
                description,
                location,
                status: 'OPEN',
                priority: 'HIGH',
            },
            include: {
                user: {
                    select: { name: true, mobile: true },
                },
                unit: {
                    select: { unitNo: true },
                },
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.EMERGENCY_RAISED,
            entity: AUDIT_ENTITIES.EMERGENCY_REQUEST,
            entityId: emergency.id,
            description: `${emergencyType} emergency raised by ${req.user.name}`,
            req,
        });

        // TODO: Trigger push notifications/sirens here

        res.status(201).json({
            success: true,
            message: 'Emergency raised successfully',
            data: emergency,
        });
    } catch (error) {
        console.error('Raise emergency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to raise emergency',
            error: error.message,
        });
    }
};

/**
 * Acknowledge Emergency
 * POST /api/v1/emergencies/:id/acknowledge
 * Access: SECURITY, SOCIETY_ADMIN
 */
export const acknowledgeEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const emergencyId = parseInt(id);

        const emergency = await prisma.emergencyRequest.findUnique({
            where: { id: emergencyId },
        });

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found',
            });
        }

        if (emergency.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                message: `Emergency is already ${emergency.status}`,
            });
        }

        const updatedEmergency = await prisma.emergencyRequest.update({
            where: { id: emergencyId },
            data: {
                status: 'ACKNOWLEDGED',
                acknowledgedAt: new Date(),
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.EMERGENCY_ACKNOWLEDGED,
            entity: AUDIT_ENTITIES.EMERGENCY_REQUEST,
            entityId: emergencyId,
            description: `Emergency ID ${emergencyId} acknowledged by ${req.user.name}`,
            req,
        });

        res.json({
            success: true,
            message: 'Emergency acknowledged',
            data: updatedEmergency,
        });
    } catch (error) {
        console.error('Acknowledge emergency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge emergency',
            error: error.message,
        });
    }
};

/**
 * Add Emergency Response Action
 * POST /api/v1/emergencies/:id/respond
 * Access: SECURITY, SOCIETY_ADMIN
 */
export const addEmergencyResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseAction, responseNotes } = req.body;
        const emergencyId = parseInt(id);

        if (!responseAction) {
            return res.status(400).json({
                success: false,
                message: 'responseAction is required',
            });
        }

        await fixSequence('emergency_responses');

        const response = await prisma.emergencyResponse.create({
            data: {
                emergencyId,
                responderId: req.user.id,
                responseAction,
                responseNotes,
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.EMERGENCY_RESPONDED,
            entity: AUDIT_ENTITIES.EMERGENCY_RESPONSE,
            entityId: response.id,
            description: `Action logged for emergency ${emergencyId}: ${responseAction}`,
            req,
        });

        res.status(201).json({
            success: true,
            message: 'Response action logged successfully',
            data: response,
        });
    } catch (error) {
        console.error('Add emergency response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log response action',
            error: error.message,
        });
    }
};

/**
 * Resolve Emergency
 * POST /api/v1/emergencies/:id/resolve
 * Access: SOCIETY_ADMIN
 */
export const resolveEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const emergencyId = parseInt(id);

        const emergency = await prisma.emergencyRequest.findUnique({
            where: { id: emergencyId },
        });

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found',
            });
        }

        const updatedEmergency = await prisma.emergencyRequest.update({
            where: { id: emergencyId },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });

        await logAction({
            user: req.user,
            action: AUDIT_ACTIONS.EMERGENCY_RESOLVED,
            entity: AUDIT_ENTITIES.EMERGENCY_REQUEST,
            entityId: emergencyId,
            description: `Emergency ID ${emergencyId} resolved by ${req.user.name}`,
            req,
        });

        res.json({
            success: true,
            message: 'Emergency resolved and closed',
            data: updatedEmergency,
        });
    } catch (error) {
        console.error('Resolve emergency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve emergency',
            error: error.message,
        });
    }
};

/**
 * Get Emergencies
 * GET /api/v1/emergencies
 * Access: RESIDENT (own), SECURITY/ADMIN (society)
 */
export const getEmergencies = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const societyId = req.user.society_id;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = { societyId };
        if (status) where.status = status;

        // Residents only see emergencies they raised
        if (req.user.role_name === 'RESIDENT') {
            where.raisedBy = req.user.id;
        }

        const [emergencies, total] = await Promise.all([
            prisma.emergencyRequest.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { raisedAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, mobile: true },
                    },
                    unit: {
                        select: { unitNo: true },
                    },
                    _count: {
                        select: { responses: true },
                    },
                },
            }),
            prisma.emergencyRequest.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                emergencies,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get emergencies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve emergencies',
            error: error.message,
        });
    }
};

/**
 * Get Emergency Timeline
 * GET /api/v1/emergencies/:id
 * Access: RESIDENT (own), SECURITY/ADMIN (society)
 */
export const getEmergencyTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const emergencyId = parseInt(id);

        const emergency = await prisma.emergencyRequest.findUnique({
            where: { id: emergencyId },
            include: {
                user: {
                    select: { name: true, mobile: true },
                },
                unit: {
                    select: { unitNo: true },
                },
                responses: {
                    include: {
                        responder: {
                            select: { name: true, role: { select: { name: true } } },
                        },
                    },
                    orderBy: { responseTime: 'asc' },
                },
            },
        });

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found',
            });
        }

        // Access control
        if (req.user.role_name === 'RESIDENT' && emergency.raisedBy !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view emergencies you raised.',
            });
        }

        if (req.user.society_id && emergency.societyId !== req.user.society_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This emergency belongs to another society.',
            });
        }

        res.json({
            success: true,
            data: emergency,
        });
    } catch (error) {
        console.error('Get emergency timeline error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve emergency details',
            error: error.message,
        });
    }
};
