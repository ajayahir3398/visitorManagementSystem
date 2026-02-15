import prisma from '../../lib/prisma.js';
import {
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
} from '../../services/firebaseService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';

/**
 * Register/Update FCM Token
 * POST /api/v1/notifications/register-token
 * Access: Authenticated users
 */
export const registerToken = async (req, res) => {
  try {
    const { token, deviceId, platform } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    // Ensure token is trimmed to avoid whitespace issues
    const trimmedToken = token.trim();

    const fcmToken = await prisma.fcmToken.upsert({
      where: { token: trimmedToken },
      update: {
        userId,
        deviceId: deviceId || undefined, // Use undefined to skip update if null
        platform: platform || undefined, // Use undefined to skip update if null
        isActive: true,
      },
      create: {
        userId,
        token: trimmedToken,
        deviceId: deviceId || null,
        platform: platform || null,
        isActive: true,
      },
    });

    const isCreated = fcmToken.createdAt.getTime() === fcmToken.updatedAt.getTime();
    const statusCode = isCreated ? 201 : 200;
    const message = isCreated ? 'FCM token registered successfully' : 'FCM token updated successfully';
    const action = isCreated ? AUDIT_ACTIONS.CREATED : AUDIT_ACTIONS.UPDATED;

    await logAction({
      user: req.user,
      action: action,
      entity: AUDIT_ENTITIES.FCM_TOKEN,
      entityId: fcmToken.id,
      description: `FCM token ${fcmToken.token} ${isCreated ? 'created' : 'updated'} for user ${userId}`,
      req,
    });

    return res.status(statusCode).json({
      success: true,
      message,
      data: {
        id: fcmToken.id,
        token: fcmToken.token,
        platform: fcmToken.platform,
        isActive: fcmToken.isActive,
      },
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: error.message,
    });
  }
};

/**
 * Remove FCM Token (logout/uninstall)
 * DELETE /api/v1/notifications/remove-token
 * Access: Authenticated users
 */
export const removeToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    // Find and deactivate token
    const fcmToken = await prisma.fcmToken.findFirst({
      where: {
        token,
        userId,
      },
    });

    if (!fcmToken) {
      return res.status(404).json({
        success: false,
        message: 'FCM token not found',
      });
    }

    await prisma.fcmToken.update({
      where: { id: fcmToken.id },
      data: { isActive: false },
    });

    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETED,
      entity: AUDIT_ENTITIES.FCM_TOKEN,
      entityId: fcmToken.id,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'FCM token removed successfully',
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token',
      error: error.message,
    });
  }
};

/**
 * Send notification to a single user
 * POST /api/v1/notifications/send
 * Access: Authenticated users (can send to themselves or admins can send to anyone)
 */
export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role_name;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    // Check permissions: Admins can send to anyone, users can only send to themselves
    const targetUserId = userId || senderId;
    if (targetUserId !== senderId && !['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send notifications to other users',
      });
    }

    // Get active FCM tokens for the user
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId: targetUserId,
        isActive: true,
      },
    });

    if (fcmTokens.length === 0) {
      // Even if no tokens, we should specific create a notification record for the user
      // so they see it when they log in.
      // But preserving original behavior for 404 might be desired? 
      // The requirement says "get notifications ... if not available". 
      // So saving to DB is crucial even if no FCM tokens.
      // However, the original code returns 404. I will change this to proceed to save to DB.
    }

    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        body,
        data: data || {},
        type: data?.type || 'SYSTEM',
        isRead: false,
      },
    });

    // Send notification to all active tokens

    const results = [];
    for (const fcmToken of fcmTokens) {
      const result = await sendNotification(fcmToken.token, { title, body }, data || {});
      results.push({
        tokenId: fcmToken.id,
        ...result,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SEND_NOTIFICATION,
      entity: AUDIT_ENTITIES.NOTIFICATION,
      entityId: targetUserId,
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Notification sent to ${successCount} device(s)`,
      data: {
        userId: targetUserId,
        successCount,
        failureCount,
        results,
      },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

/**
 * Send notification to multiple users
 * POST /api/v1/notifications/send-bulk
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;
    const senderRole = req.user.role_name;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send bulk notifications',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
      });
    }

    // Filter users by society if SOCIETY_ADMIN
    let whereClause = {
      id: { in: userIds },
    };

    if (senderRole === 'SOCIETY_ADMIN') {
      whereClause.societyId = req.user.society_id;
    }

    // Get all active FCM tokens for the users
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        fcmTokens: {
          where: { isActive: true },
        },
      },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    if (allTokens.length === 0) {
      // Proceed to save to DB even if no tokens
    }

    // Save notifications to database for all users
    const notificationsData = userIds.map((userId) => ({
      userId,
      title,
      body,
      data: data || {},
      type: data?.type || 'SYSTEM',
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    // Send multicast notification

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SEND_NOTIFICATION,
      entity: AUDIT_ENTITIES.NOTIFICATION,
      description: `Bulk notification sent to ${userIds.length} users`,
      req,
    });

    return res.status(200).json({
      success: result.success,
      message: `Notification sent to ${result.successCount} device(s)`,
      data: {
        totalTokens: allTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
      error: error.message,
    });
  }
};

/**
 * Send notification to users by role
 * POST /api/v1/notifications/send-by-role
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const sendNotificationByRole = async (req, res) => {
  try {
    const { role, title, body, data } = req.body;
    const senderRole = req.user.role_name;
    const senderSocietyId = req.user.society_id;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send notifications by role',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      });
    }

    // Get role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Build where clause
    let whereClause = {
      roleId: roleRecord.id,
      status: 'active',
    };

    // SOCIETY_ADMIN can only send to users in their society
    if (senderRole === 'SOCIETY_ADMIN') {
      whereClause.societyId = senderSocietyId;
    }

    // Get all active FCM tokens for users with this role
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        fcmTokens: {
          where: { isActive: true },
        },
      },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    if (allTokens.length === 0) {
      // Proceed to save to DB
    }

    // Save notifications to database for all users
    const notificationsData = users.map((user) => ({
      userId: user.id,
      title,
      body,
      data: data || {},
      type: data?.type || 'SYSTEM',
      isRead: false,
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    // Send multicast notification

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SEND_NOTIFICATION,
      entity: AUDIT_ENTITIES.NOTIFICATION,
      description: `Notification sent to ${users.length} users with role: ${role}`,
      req,
    });

    return res.status(200).json({
      success: result.success,
      message: `Notification sent to ${result.successCount} device(s)`,
      data: {
        role,
        totalUsers: users.length,
        totalTokens: allTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });
  } catch (error) {
    console.error('Error sending notification by role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification by role',
      error: error.message,
    });
  }
};

/**
 * Send notification to all users in a society
 * POST /api/v1/notifications/send-by-society
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const sendNotificationBySociety = async (req, res) => {
  try {
    const { societyId, title, body, data } = req.body;
    const senderRole = req.user.role_name;
    const senderSocietyId = req.user.society_id;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send notifications by society',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    // Determine target society
    const targetSocietyId = societyId || senderSocietyId;

    // SOCIETY_ADMIN can only send to their own society
    if (senderRole === 'SOCIETY_ADMIN' && targetSocietyId !== senderSocietyId) {
      return res.status(403).json({
        success: false,
        message: 'You can only send notifications to your own society',
      });
    }

    // Get all active FCM tokens for users in this society
    const users = await prisma.user.findMany({
      where: {
        societyId: targetSocietyId,
        status: 'active',
      },
      include: {
        fcmTokens: {
          where: { isActive: true },
        },
      },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    if (allTokens.length === 0) {
      // Proceed
    }

    // Save notifications to database for all users
    const notificationsData = users.map((user) => ({
      userId: user.id,
      title,
      body,
      data: data || {},
      type: data?.type || 'SYSTEM',
      isRead: false,
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    // Send multicast notification

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SEND_NOTIFICATION,
      entity: AUDIT_ENTITIES.NOTIFICATION,
      description: `Notification sent to ${users.length} users in society ${targetSocietyId}`,
      req,
    });

    return res.status(200).json({
      success: result.success,
      message: `Notification sent to ${result.successCount} device(s)`,
      data: {
        societyId: targetSocietyId,
        totalUsers: users.length,
        totalTokens: allTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });
  } catch (error) {
    console.error('Error sending notification by society:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification by society',
      error: error.message,
    });
  }
};

/**
 * Get user's FCM tokens
 * GET /api/v1/notifications/tokens
 * Access: Authenticated users
 */
export const getUserTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const senderRole = req.user.role_name;

    // Check if requesting own tokens or admin requesting other user's tokens
    const targetUserId = req.query.userId ? parseInt(req.query.userId) : userId;

    if (targetUserId !== userId && !['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view other users tokens',
      });
    }

    const tokens = await prisma.fcmToken.findMany({
      where: {
        userId: targetUserId,
      },
      select: {
        id: true,
        token: true,
        deviceId: true,
        platform: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        userId: targetUserId,
        tokens,
        count: tokens.length,
      },
    });
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user tokens',
      error: error.message,
    });
  }
};

/**
 * Get user's notifications
 * GET /api/v1/notifications
 * Access: Authenticated users
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
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
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 * Access: Authenticated users
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 * Access: Authenticated users
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 * Access: Authenticated users
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};
