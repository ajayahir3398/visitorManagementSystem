import { NotificationService } from '../../services/notificationService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const registerToken = asyncHandler(async (req, res) => {
  if (!req.body.token)
    return res.status(400).json({ success: false, message: 'FCM token is required' });

  const { fcmToken, isCreated } = await NotificationService.registerToken({
    ...req.body,
    reqUser: req.user,
  });

  const statusCode = isCreated ? 201 : 200;
  const message = isCreated
    ? 'FCM token registered successfully'
    : 'FCM token updated successfully';
  const action = isCreated ? AUDIT_ACTIONS.CREATED : AUDIT_ACTIONS.UPDATED;

  await logAction({
    user: req.user,
    action: action,
    entity: AUDIT_ENTITIES.FCM_TOKEN,
    entityId: fcmToken.id,
    description: `FCM token ${fcmToken.token} ${isCreated ? 'created' : 'updated'} for user ${req.user.id}`,
    req,
  });

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      id: fcmToken.id,
      token: fcmToken.token,
      platform: fcmToken.platform,
      isActive: fcmToken.isActive,
    },
  });
});

export const removeToken = asyncHandler(async (req, res) => {
  if (!req.body.token)
    return res.status(400).json({ success: false, message: 'FCM token is required' });

  const fcmToken = await NotificationService.removeToken({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETED,
    entity: AUDIT_ENTITIES.FCM_TOKEN,
    entityId: fcmToken.id,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'FCM token removed successfully',
  });
});

export const sendNotificationToUser = asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.body) {
    return res.status(400).json({ success: false, message: 'Title and body are required' });
  }

  const { targetUserId, successCount, failureCount, results } =
    await NotificationService.sendNotificationToUser({
      ...req.body,
      reqUser: req.user,
    });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SEND_NOTIFICATION,
    entity: AUDIT_ENTITIES.NOTIFICATION,
    entityId: targetUserId,
    req,
  });

  res.status(200).json({
    success: true,
    message: `Notification sent to ${successCount} device(s)`,
    data: { userId: targetUserId, successCount, failureCount, results },
  });
});

export const sendBulkNotification = asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.body) {
    return res.status(400).json({ success: false, message: 'Title and body are required' });
  }

  const { result, allTokensCount } = await NotificationService.sendBulkNotification({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SEND_NOTIFICATION,
    entity: AUDIT_ENTITIES.NOTIFICATION,
    description: `Bulk notification sent to ${req.body.userIds.length} users`,
    req,
  });

  res.status(200).json({
    success: result.success,
    message: `Notification sent to ${result.successCount} device(s)`,
    data: {
      totalTokens: allTokensCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    },
  });
});

export const sendNotificationByRole = asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.body)
    return res.status(400).json({ success: false, message: 'Title and body are required' });
  if (!req.body.role) return res.status(400).json({ success: false, message: 'Role is required' });

  const { result, usersCount, tokensCount } = await NotificationService.sendNotificationByRole({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SEND_NOTIFICATION,
    entity: AUDIT_ENTITIES.NOTIFICATION,
    description: `Notification sent to ${usersCount} users with role: ${req.body.role}`,
    req,
  });

  res.status(200).json({
    success: result.success,
    message: `Notification sent to ${result.successCount} device(s)`,
    data: {
      role: req.body.role,
      totalUsers: usersCount,
      totalTokens: tokensCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    },
  });
});

export const sendNotificationBySociety = asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.body)
    return res.status(400).json({ success: false, message: 'Title and body are required' });

  const { result, targetSocietyId, usersCount, tokensCount } =
    await NotificationService.sendNotificationBySociety({
      ...req.body,
      reqUser: req.user,
    });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SEND_NOTIFICATION,
    entity: AUDIT_ENTITIES.NOTIFICATION,
    description: `Notification sent to ${usersCount} users in society ${targetSocietyId}`,
    req,
  });

  res.status(200).json({
    success: result.success,
    message: `Notification sent to ${result.successCount} device(s)`,
    data: {
      societyId: targetSocietyId,
      totalUsers: usersCount,
      totalTokens: tokensCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
    },
  });
});

export const getUserTokens = asyncHandler(async (req, res) => {
  const { tokens, targetUserId } = await NotificationService.getUserTokens({
    queryUserId: req.query.userId,
    reqUser: req.user,
  });

  res.status(200).json({
    success: true,
    data: {
      userId: targetUserId,
      tokens,
      count: tokens.length,
    },
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const { notifications, total, unreadCount, page, limit } =
    await NotificationService.getNotifications({
      page: parseInt(req.query.page),
      limit: parseInt(req.query.limit),
      reqUser: req.user,
    });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAsRead({
    notificationId: req.params.id,
    reqUser: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead({ reqUser: req.user });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await NotificationService.getUnreadCount({ reqUser: req.user });

  res.status(200).json({
    success: true,
    data: { count },
  });
});
