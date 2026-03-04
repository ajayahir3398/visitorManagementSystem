import prisma from '../lib/prisma.js';
import { sendNotification, sendMulticastNotification } from './firebaseService.js';

const getValidNotificationType = (type) => {
  if (!type) return 'SYSTEM';
  const upperType = type.toUpperCase();
  if (['VISITOR', 'SYSTEM', 'EMERGENCY'].includes(upperType)) return upperType;
  if (upperType.includes('VISITOR')) return 'VISITOR';
  if (upperType.includes('EMERGENCY')) return 'EMERGENCY';
  return 'SYSTEM';
};

export const NotificationService = {
  registerToken: async ({ token, deviceId, platform, reqUser }) => {
    const userId = reqUser.id;
    const trimmedToken = token.trim();

    const fcmToken = await prisma.fcmToken.upsert({
      where: { token: trimmedToken },
      update: {
        userId,
        deviceId: deviceId || undefined,
        platform: platform ? platform.toUpperCase() : undefined,
      },
      create: {
        userId,
        token: trimmedToken,
        deviceId: deviceId || null,
        platform: platform ? platform.toUpperCase() : null,
        isActive: true,
      },
    });

    const isCreated = fcmToken.createdAt.getTime() === fcmToken.updatedAt.getTime();
    return { fcmToken, isCreated };
  },

  removeToken: async ({ token, reqUser }) => {
    const userId = reqUser.id;

    const fcmToken = await prisma.fcmToken.findFirst({
      where: { token, userId },
    });

    if (!fcmToken) throw { status: 404, message: 'FCM token not found' };

    await prisma.fcmToken.update({
      where: { id: fcmToken.id },
      data: { isActive: false },
    });

    return fcmToken;
  },

  sendNotificationToUser: async ({ userId, title, body, data, reqUser }) => {
    const senderId = reqUser.id;
    const senderRole = reqUser.role_name;

    const targetUserId = userId || senderId;

    if (
      targetUserId !== senderId &&
      !['SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY'].includes(senderRole)
    ) {
      throw {
        status: 403,
        message: 'You do not have permission to send notifications to other users',
      };
    }

    const fcmTokens = await prisma.fcmToken.findMany({
      where: { userId: targetUserId, isActive: true },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        body,
        data: data || {},
        type: getValidNotificationType(data?.type),
        isRead: false,
      },
    });

    const results = [];
    for (const fcmToken of fcmTokens) {
      const result = await sendNotification(fcmToken.token, { title, body }, data || {});
      results.push({ tokenId: fcmToken.id, ...result });
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return { targetUserId, successCount, failureCount, results, notification };
  },

  sendBulkNotification: async ({ userIds, title, body, data, reqUser }) => {
    const senderRole = reqUser.role_name;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      throw { status: 403, message: 'Only admins can send bulk notifications' };
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw { status: 400, message: 'User IDs array is required' };
    }

    let whereClause = { id: { in: userIds } };
    if (senderRole === 'SOCIETY_ADMIN') {
      whereClause.societyId = reqUser.society_id;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { fcmTokens: { where: { isActive: true } } },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    const notificationsData = userIds.map((userId) => ({
      userId,
      title,
      body,
      data: data || {},
      type: getValidNotificationType(data?.type),
      isRead: false,
    }));

    await prisma.notification.createMany({ data: notificationsData });

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    return { result, allTokensCount: allTokens.length, usersCount: userIds.length };
  },

  sendNotificationByRole: async ({ role, title, body, data, reqUser }) => {
    const senderRole = reqUser.role_name;
    const senderSocietyId = reqUser.society_id;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      throw { status: 403, message: 'Only admins can send notifications by role' };
    }

    const roleRecord = await prisma.role.findUnique({ where: { name: role } });

    if (!roleRecord) throw { status: 404, message: 'Role not found' };

    let whereClause = { roleId: roleRecord.id, status: 'ACTIVE' };
    if (senderRole === 'SOCIETY_ADMIN') whereClause.societyId = senderSocietyId;

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { fcmTokens: { where: { isActive: true } } },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    const notificationsData = users.map((user) => ({
      userId: user.id,
      title,
      body,
      data: data || {},
      type: getValidNotificationType(data?.type),
      isRead: false,
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({ data: notificationsData });
    }

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    return { result, usersCount: users.length, tokensCount: allTokens.length };
  },

  sendNotificationBySociety: async ({ societyId, title, body, data, reqUser }) => {
    const senderRole = reqUser.role_name;
    const senderSocietyId = reqUser.society_id;

    if (!['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      throw { status: 403, message: 'Only admins can send notifications by society' };
    }

    const targetSocietyId = societyId || senderSocietyId;

    if (senderRole === 'SOCIETY_ADMIN' && targetSocietyId !== senderSocietyId) {
      throw { status: 403, message: 'You can only send notifications to your own society' };
    }

    const users = await prisma.user.findMany({
      where: { societyId: targetSocietyId, status: 'ACTIVE' },
      include: { fcmTokens: { where: { isActive: true } } },
    });

    const allTokens = users.flatMap((user) => user.fcmTokens.map((token) => token.token));

    const notificationsData = users.map((user) => ({
      userId: user.id,
      title,
      body,
      data: data || {},
      type: getValidNotificationType(data?.type),
      isRead: false,
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({ data: notificationsData });
    }

    const result = await sendMulticastNotification(allTokens, { title, body }, data || {});

    return { result, targetSocietyId, usersCount: users.length, tokensCount: allTokens.length };
  },

  getUserTokens: async ({ queryUserId, reqUser }) => {
    const userId = reqUser.id;
    const senderRole = reqUser.role_name;
    const targetUserId = queryUserId ? parseInt(queryUserId) : userId;

    if (targetUserId !== userId && !['SUPER_ADMIN', 'SOCIETY_ADMIN'].includes(senderRole)) {
      throw { status: 403, message: 'You do not have permission to view other users tokens' };
    }

    const tokens = await prisma.fcmToken.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        token: true,
        deviceId: true,
        platform: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { tokens, targetUserId };
  },

  getNotifications: async ({ page = 1, limit = 20, reqUser }) => {
    const userId = reqUser.id;
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
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount, page, limit };
  },

  markAsRead: async ({ notificationId, reqUser }) => {
    const userId = reqUser.id;

    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(notificationId), userId },
    });

    if (!notification) throw { status: 404, message: 'Notification not found' };

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    return notification;
  },

  markAllAsRead: async ({ reqUser }) => {
    const userId = reqUser.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  getUnreadCount: async ({ reqUser }) => {
    const userId = reqUser.id;

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return count;
  },
};
