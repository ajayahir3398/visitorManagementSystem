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
    console.log(
      `🔔 [NotifHelper] sendNotificationToUser called — userId: ${userId}, title: "${title}"`
    );

    if (!userId) {
      console.error('❌ [NotifHelper] sendNotificationToUser: userId is missing/undefined');
      return { success: false, error: 'userId is required', sentCount: 0 };
    }

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
      console.log(
        `✅ [NotifHelper] Notification stored in DB for user ${userId}, ID: ${notification.id}`
      );
    } catch (dbError) {
      console.error('❌ [NotifHelper] Error saving notification to DB:', dbError.message);
    }

    // 2. Get active FCM tokens for the user
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    console.log(
      `🔍 [NotifHelper] Found ${fcmTokens.length} active FCM token(s) for user ${userId}`
    );

    if (fcmTokens.length === 0) {
      console.log(
        `⚠️ [NotifHelper] No active FCM tokens for user ${userId}. Notification saved to DB only.`
      );
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

    console.log(
      `📨 [NotifHelper] FCM result for user ${userId}: success=${result.success}, sent=${result.successCount || 0}, failed=${result.failureCount || 0}`
    );

    return {
      success: result.success,
      sentCount: result.successCount || 0,
      failedCount: result.failureCount || 0,
      notificationId: notification?.id,
    };
  } catch (error) {
    console.error(
      `❌ [NotifHelper] sendNotificationToUser FAILED for user ${userId}:`,
      error.message
    );
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
    console.log(
      `🔔 [NotifHelper] sendNotificationToUsers called — userIds: [${userIds?.join(', ')}], title: "${title}"`
    );

    if (!userIds || userIds.length === 0) {
      console.log(`⚠️ [NotifHelper] sendNotificationToUsers: No user IDs provided`);
      return {
        success: false,
        message: 'No user IDs provided',
        sentCount: 0,
      };
    }

    // 1. Create notification records in database
    try {
      const notificationsData = userIds.map((userId) => ({
        userId,
        title,
        body,
        data: data || {},
        type: data.type || 'SYSTEM',
        isRead: false,
      }));

      const dbResult = await prisma.notification.createMany({
        data: notificationsData,
      });
      console.log(
        `✅ [NotifHelper] ${dbResult.count} notification(s) stored in DB for ${userIds.length} user(s)`
      );
    } catch (dbError) {
      console.error('❌ [NotifHelper] Error saving notifications to DB:', dbError.message);
    }

    // 2. Get active FCM tokens for all users
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    console.log(
      `🔍 [NotifHelper] Found ${fcmTokens.length} active FCM token(s) for ${userIds.length} user(s)`
    );

    if (fcmTokens.length === 0) {
      console.log(
        `⚠️ [NotifHelper] No active FCM tokens for users: [${userIds.join(', ')}]. Notifications saved to DB only.`
      );
      return {
        success: true,
        message: 'Notifications saved but no active FCM tokens found',
        sentCount: 0,
      };
    }

    // 3. Send multicast notification
    const tokens = fcmTokens.map((token) => token.token);
    const result = await sendMulticastNotification(tokens, { title, body }, data);

    console.log(
      `📨 [NotifHelper] FCM multicast result: success=${result.success}, sent=${result.successCount || 0}, failed=${result.failureCount || 0}`
    );

    return {
      success: result.success,
      sentCount: result.successCount || 0,
      failedCount: result.failureCount || 0,
    };
  } catch (error) {
    console.error(`❌ [NotifHelper] sendNotificationToUsers FAILED:`, error.message);
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
    console.log(`🔔 [NotifHelper] sendNotificationToUnitResidents called — unitId: ${unitId}`);

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
      console.log(`⚠️ [NotifHelper] No residents found for unit ${unitId}`);
      return {
        success: false,
        message: 'No residents found for unit',
        sentCount: 0,
      };
    }

    const userIds = unitMembers.map((member) => member.userId);
    console.log(
      `👥 [NotifHelper] Found ${userIds.length} resident(s) in unit ${unitId}: [${userIds.join(', ')}]`
    );
    return await sendNotificationToUsers(userIds, title, body, data);
  } catch (error) {
    console.error(
      `❌ [NotifHelper] sendNotificationToUnitResidents FAILED for unit ${unitId}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};

/**
 * Send notification to residents by flatNo (resolves flatNo to unitId)
 * Used when a visitor entry is created with only flatNo and no unitId
 * @param {number} societyId - Society ID to scope the unit lookup
 * @param {string} flatNo - Flat number to resolve
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>}
 */
export const sendNotificationToUnitResidentsByFlatNo = async (
  societyId,
  flatNo,
  title,
  body,
  data = {}
) => {
  try {
    console.log(
      `🔔 [NotifHelper] sendNotificationToUnitResidentsByFlatNo called — societyId: ${societyId}, flatNo: "${flatNo}"`
    );

    if (!societyId || !flatNo) {
      console.log(`⚠️ [NotifHelper] Missing societyId or flatNo, cannot resolve unit`);
      return { success: false, message: 'societyId and flatNo are required', sentCount: 0 };
    }

    // Resolve flatNo to a unit within the society
    const unit = await prisma.unit.findFirst({
      where: {
        societyId,
        unitNo: { equals: flatNo, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (!unit) {
      console.log(`⚠️ [NotifHelper] No unit found for flatNo "${flatNo}" in society ${societyId}`);
      return { success: false, message: `No unit found for flatNo: ${flatNo}`, sentCount: 0 };
    }

    console.log(`✅ [NotifHelper] Resolved flatNo "${flatNo}" → unitId: ${unit.id}`);
    return await sendNotificationToUnitResidents(unit.id, title, body, data);
  } catch (error) {
    console.error(
      `❌ [NotifHelper] sendNotificationToUnitResidentsByFlatNo FAILED:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};
