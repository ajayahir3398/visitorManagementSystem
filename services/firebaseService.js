import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

/**
 * Initialize Firebase Admin SDK
 * Make sure to set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env
 */
let firebaseApp = null;

export const initializeFirebase = async () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    // Option 1: Service account JSON file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Read and parse JSON file
      const serviceAccount = JSON.parse(
        readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Option 2: Service account JSON as environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    // Option 3: Use default credentials (for Google Cloud environments)
    else {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

/**
 * Send notification to a single FCM token
 * @param {string} token - FCM token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>}
 */
export const sendNotification = async (token, notification, data = {}) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const message = {
      token,
      notification: {
        title: notification.title || 'Notification',
        body: notification.body || '',
      },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Send notification to multiple FCM tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>}
 */
export const sendMulticastNotification = async (tokens, notification, data = {}) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    if (!tokens || tokens.length === 0) {
      return {
        success: false,
        error: 'No tokens provided',
      };
    }

    // FCM allows max 500 tokens per batch
    const maxTokens = 500;
    const batches = [];
    for (let i = 0; i < tokens.length; i += maxTokens) {
      batches.push(tokens.slice(i, i + maxTokens));
    }

    const results = {
      successCount: 0,
      failureCount: 0,
      responses: [],
    };

    for (const batch of batches) {
      const message = {
        tokens: batch,
        notification: {
          title: notification.title || 'Notification',
          body: notification.body || '',
        },
        data: Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      results.successCount += response.successCount;
      results.failureCount += response.failureCount;
      results.responses.push(response);
    }

    return {
      success: true,
      ...results,
    };
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name (e.g., 'society_1', 'role_RESIDENT')
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>}
 */
export const sendTopicNotification = async (topic, notification, data = {}) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const message = {
      topic,
      notification: {
        title: notification.title || 'Notification',
        body: notification.body || '',
      },
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Subscribe tokens to a topic
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>}
 */
export const subscribeToTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors || [],
    };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Unsubscribe tokens from a topic
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>}
 */
export const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      await initializeFirebase();
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors || [],
    };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Note: Firebase initialization will happen on first use
// For synchronous initialization, call initializeFirebase() in your app startup
