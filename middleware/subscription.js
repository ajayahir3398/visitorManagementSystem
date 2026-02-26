import {
  getSubscription,
  updateSubscriptionStatus,
  isSubscriptionActive,
} from '../services/subscriptionService.js';

/**
 * Middleware to check subscription status
 * Blocks access if subscription is LOCKED or SUSPENDED
 */
export const checkSubscription = async (req, res, next) => {
  try {
    // Skip check for SUPER_ADMIN
    if (req.user?.role_name === 'SUPER_ADMIN') {
      return next();
    }

    // Get society ID from user
    const societyId = req.user?.society_id || req.user?.societyId;

    if (!societyId) {
      return res.status(403).json({
        success: false,
        message: 'No society associated with this user',
      });
    }

    // Get subscription
    let subscription = await getSubscription(societyId);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found. Please contact support.',
      });
    }

    // Auto-update status based on expiry
    subscription = await updateSubscriptionStatus(subscription);

    // Check if subscription allows access
    if (!isSubscriptionActive(subscription)) {
      const statusMessages = {
        LOCKED: 'Your subscription has expired. Please renew to continue using the service.',
        SUSPENDED: 'Your subscription has been suspended. Please contact support.',
      };

      return res.status(403).json({
        success: false,
        message: statusMessages[subscription.status] || 'Subscription is not active',
        data: {
          status: subscription.status,
          expiryDate: subscription.expiryDate,
        },
      });
    }

    // Attach subscription to request for use in controllers
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
    });
  }
};

/**
 * Optional subscription check - doesn't block, just attaches subscription info
 */
export const attachSubscription = async (req, res, next) => {
  try {
    const societyId = req.user?.society_id || req.user?.societyId;

    if (societyId) {
      let subscription = await getSubscription(societyId);

      if (subscription) {
        // Auto-update status
        subscription = await updateSubscriptionStatus(subscription);
      }

      req.subscription = subscription;
    }

    next();
  } catch (error) {
    console.error('Attach subscription error:', error);
    // Don't block request, just continue
    next();
  }
};
