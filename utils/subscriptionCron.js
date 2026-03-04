import {
  updateAllSubscriptionStatuses,
  checkSubscriptionExpiryAndNotify,
} from '../services/subscriptionService.js';
import cron from 'node-cron';

/**
 * Check if error is a database connection error
 */
const isDatabaseConnectionError = (error) => {
  return (
    error?.code === 'P1001' || // Can't reach database server
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes("Can't reach database server") ||
    error?.message?.includes('DatabaseNotReachable')
  );
};

/**
 * Cron job to auto-update subscription statuses
 * This should be called daily (e.g., at midnight)
 *
 * Usage:
 * - Set up a cron job to call this function daily
 * - Or use node-cron package to schedule it
 */
export const runSubscriptionStatusUpdate = async () => {
  try {
    console.log('Starting subscription status update...');
    const result = await updateAllSubscriptionStatuses();
    console.log(
      `✅ Subscription status update completed: ${result.updated}/${result.total} updated`
    );

    // Also check for expiry verification and notifications
    await checkSubscriptionExpiryAndNotify();

    return result;
  } catch (error) {
    // Handle database connection errors gracefully
    if (isDatabaseConnectionError(error)) {
      console.warn(
        '⚠️  Database not available for subscription status update. Will retry on next scheduled run.'
      );
      return { total: 0, updated: 0 };
    }

    // Log other errors but don't throw
    console.error('❌ Error in subscription status update:', error.message);
    return { total: 0, updated: 0 };
  }
};

/**
 * Schedule subscription status updates using node-cron
 * Run daily at midnight (00:00)
 */
export const scheduleSubscriptionUpdates = () => {
  try {
    // Run daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
      await runSubscriptionStatusUpdate();
    });

    console.log('✅ Subscription status update scheduler started (daily at midnight)');

    // Also run on server start to update any expired subscriptions immediately
    // Use setTimeout to delay initial run, giving database time to connect
    setTimeout(async () => {
      try {
        await runSubscriptionStatusUpdate();
      } catch (_error) {
        // Silently handle errors - database might not be ready yet
        // The scheduled cron job will handle updates once database is available
      }
    }, 5000); // Wait 5 seconds after server start
  } catch (error) {
    console.error('❌ Error starting subscription update scheduler:', error);
  }
};
