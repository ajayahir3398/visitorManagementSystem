import prisma from '../lib/prisma.js';
import { sendMulticastNotification } from '../services/firebaseService.js';

/**
 * Send notification to a single user
 * @param {number} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>}
 */
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // 1. Create notification record in database (Persist first)
    let notification;
    try {
      notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          data: data || {},
          type: data.type || 'SYSTEM',
          isRead: false,
        },
      });
      console.log(`✅ Notification stored in DB for user ${userId}, ID: ${notification.id}`);
    } catch (dbError) {
      console.error('❌ Error saving notification to DB:', dbError);
      // We continue to try sending FCM even if DB save fails, or should we?
      // Better to have it in DB. If DB fails, something is critical.
    }

    // 2. Get active FCM tokens for the user
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (fcmTokens.length === 0) {
      console.log(`⚠️ No active FCM tokens found for user ${userId}. Notification saved but not sent.`);
      return {
        success: true, // success true because it is saved in DB
        message: 'Notification saved but no active FCM tokens found',
        sentCount: 0,
        notificationId: notification?.id,
      };
    }

    // 3. Send notification to all active tokens
    const tokens = fcmTokens.map((token) => token.token);
    const result = await sendMulticastNotification(tokens, { title, body }, data);

    console.log(`📨 FCM Send Result for user ${userId}:`, JSON.stringify(result));

    return {
      success: result.success,
      sentCount: result.successCount || 0,
      failedCount: result.failureCount || 0,
      notificationId: notification?.id,
    };
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};

/**
 * Send notification to multiple users
 * @param {number[]} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>}
 */
export const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: 'No user IDs provided',
        sentCount: 0,
      };
    }

    // 1. Create notification records in database
    try {
      // Prepare data for createMany
      const notificationsData = userIds.map(userId => ({
        userId,
        title,
        body,
        data: data || {}, // Prisma handles JSON stringification if mapped correctly, but ensuring object/json
        type: data.type || 'SYSTEM',
        isRead: false,
      }));

      const dbResult = await prisma.notification.createMany({
        data: notificationsData,
      });
      console.log(`✅ ${dbResult.count} notifications stored in DB`);
    } catch (dbError) {
      console.error('❌ Error saving notifications to DB:', dbError);
    }

    // 2. Get active FCM tokens for all users
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (fcmTokens.length === 0) {
      console.log(`⚠️ No active FCM tokens found for users: ${userIds.join(', ')}`);
      return {
        success: true,
        message: 'Notifications saved but no active FCM tokens found',
        sentCount: 0,
      };
    }

    // 3. Send multicast notification
    const tokens = fcmTokens.map((token) => token.token);
    const result = await sendMulticastNotification(tokens, { title, body }, data);

    console.log(`📨 FCM Multicast Send Result:`, JSON.stringify(result));

    return {
      success: result.success,
      sentCount: result.successCount || 0,
      failedCount: result.failureCount || 0,
    };
  } catch (error) {
    console.error('Error sending notification to users:', error);
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};

/**
 * Send notification to all residents of a unit
 * @param {number} unitId - Unit ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>}
 */
export const sendNotificationToUnitResidents = async (unitId, title, body, data = {}) => {
  try {
    // Get all unit members (residents)
    const unitMembers = await prisma.unitMember.findMany({
      where: {
        unitId,
      },
      select: {
        userId: true,
      },
    });

    if (unitMembers.length === 0) {
      console.log(`No residents found for unit ${unitId}`);
      return {
        success: false,
        message: 'No residents found for unit',
        sentCount: 0,
      };
    }

    const userIds = unitMembers.map((member) => member.userId);
    return await sendNotificationToUsers(userIds, title, body, data);
  } catch (error) {
    console.error('Error sending notification to unit residents:', error);
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};
