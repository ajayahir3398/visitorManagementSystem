import { EmergencyService } from '../../services/emergencyService.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import prisma from '../../lib/prisma.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const raiseEmergency = asyncHandler(async (req, res) => {
  const { emergencyType } = req.body;
  const emergency = await EmergencyService.raiseEmergency({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.EMERGENCY_RAISED,
    entity: AUDIT_ENTITIES.EMERGENCY_REQUEST,
    entityId: emergency.id,
    description: `${emergencyType} emergency raised by ${req.user.name}`,
    req,
  });

  // Trigger push notifications
  try {
    const societyId = req.user.society_id;
    const notificationTitle = `EMERGENCY: ${emergencyType}`;
    const notificationBody = `${req.user.name} raised a ${emergencyType} emergency at ${emergency.unit?.unitNo || emergency.location || 'unknown location'}`;

    // Get all security and admin users for this society
    const targetUsers = await prisma.user.findMany({
      where: {
        societyId,
        role: {
          name: { in: ['SECURITY', 'SOCIETY_ADMIN'] },
        },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const userIds = targetUsers.map((u) => u.id);
    if (userIds.length > 0) {
      await sendNotificationToUsers(userIds, notificationTitle, notificationBody, {
        screen: 'emergency_detail',
        emergencyId: emergency.id.toString(),
        type: 'emergency',
      });
    }
  } catch (error) {
    req.logger?.error('Error sending emergency notifications:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Emergency raised successfully',
    data: emergency,
  });
});

export const acknowledgeEmergency = asyncHandler(async (req, res) => {
  const emergencyId = parseInt(req.params.id);
  const updatedEmergency = await EmergencyService.acknowledgeEmergency({
    emergencyId,
    reqUser: req.user,
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
});

export const addEmergencyResponse = asyncHandler(async (req, res) => {
  const emergencyId = parseInt(req.params.id);
  const { responseAction } = req.body;

  const response = await EmergencyService.addEmergencyResponse({
    emergencyId,
    ...req.body,
    reqUser: req.user,
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
});

export const resolveEmergency = asyncHandler(async (req, res) => {
  const emergencyId = parseInt(req.params.id);
  const updatedEmergency = await EmergencyService.resolveEmergency({
    emergencyId,
    reqUser: req.user,
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
});

export const getEmergencies = asyncHandler(async (req, res) => {
  const { emergencies, total, page, limit } = await EmergencyService.getEmergencies({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
    reqUser: req.user,
  });

  res.json({
    success: true,
    data: {
      emergencies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getEmergencyTimeline = asyncHandler(async (req, res) => {
  const emergency = await EmergencyService.getEmergencyTimeline({
    emergencyId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    data: emergency,
  });
});
