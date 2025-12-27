import prisma from '../lib/prisma.js';

/**
 * Get subscription for a society
 */
export const getSubscription = async (societyId) => {
  if (!societyId) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      societyId,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc', // Get the latest subscription
    },
  });

  return subscription;
};

/**
 * Calculate subscription status based on expiry date
 * Logic:
 * - If today > expiryDate:
 *   - If daysSinceExpiry <= graceDays: GRACE
 *   - Else: LOCKED
 * - If today <= expiryDate: Keep current status (TRIAL/ACTIVE)
 */
export const calculateSubscriptionStatus = (subscription) => {
  if (!subscription || !subscription.expiryDate) {
    return subscription?.status || 'LOCKED';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(subscription.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);

  // If subscription is manually SUSPENDED, don't auto-update
  if (subscription.status === 'SUSPENDED') {
    return 'SUSPENDED';
  }

  // If not expired yet, keep current status
  if (today <= expiryDate) {
    return subscription.status;
  }

  // Calculate days since expiry
  const daysSinceExpiry = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));

  // If within grace period
  if (daysSinceExpiry <= subscription.graceDays) {
    return 'GRACE';
  }

  // Beyond grace period
  return 'LOCKED';
};

/**
 * Update subscription status based on expiry date
 */
export const updateSubscriptionStatus = async (subscription) => {
  if (!subscription) {
    return null;
  }

  const newStatus = calculateSubscriptionStatus(subscription);

  // Only update if status changed
  if (newStatus !== subscription.status) {
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: newStatus },
      include: {
        plan: true,
      },
    });

    return updated;
  }

  return subscription;
};

/**
 * Auto-update all subscription statuses
 * This should be called periodically (e.g., via cron job)
 */
export const updateAllSubscriptionStatuses = async () => {
  try {
    // Get all subscriptions that are not SUSPENDED
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          not: 'SUSPENDED', // Don't auto-update suspended subscriptions
        },
        expiryDate: {
          not: null,
        },
      },
      include: {
        plan: true,
      },
    });

    let updatedCount = 0;

    for (const subscription of subscriptions) {
      try {
        const newStatus = calculateSubscriptionStatus(subscription);
        
        if (newStatus !== subscription.status) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: newStatus },
          });
          updatedCount++;
        }
      } catch (updateError) {
        // Log individual update errors but continue with other subscriptions
        console.error(`Error updating subscription ${subscription.id}:`, updateError.message);
      }
    }

    return {
      total: subscriptions.length,
      updated: updatedCount,
    };
  } catch (error) {
    // Re-throw to let caller handle (they'll check for connection errors)
    throw error;
  }
};

/**
 * Create a TRIAL subscription for a society
 * Default: 60 days trial
 */
export const createTrialSubscription = async (societyId, durationDays = 60) => {
  try {
    // Find or create TRIAL plan
    let trialPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        name: 'TRIAL',
        isActive: true,
      },
    });

    if (!trialPlan) {
      // Create default TRIAL plan if it doesn't exist
      trialPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'TRIAL',
          price: 0,
          durationMonths: 0, // Trial is in days, not months
          visitorLimit: null, // Unlimited for trial
          features: {
            trial: true,
            duration_days: durationDays,
          },
          isActive: true,
        },
      });
    }

    // Calculate dates
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    expiryDate.setHours(23, 59, 59, 999);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        societyId,
        planId: trialPlan.id,
        status: 'TRIAL',
        startDate,
        expiryDate,
        graceDays: 3,
      },
      include: {
        plan: true,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    throw error;
  }
};

/**
 * Check if subscription allows access
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) {
    return false;
  }

  const allowedStatuses = ['TRIAL', 'ACTIVE', 'GRACE'];
  return allowedStatuses.includes(subscription.status);
};

/**
 * Extend subscription period
 * Can extend trial or any active subscription
 */
export const extendSubscription = async (subscriptionId, additionalDays) => {
  try {
    if (!subscriptionId || !additionalDays || additionalDays <= 0) {
      throw new Error('Invalid subscription ID or extension days');
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        society: true,
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate new expiry date
    let newExpiryDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If subscription is already expired, extend from today
    // Otherwise, extend from current expiry date
    if (subscription.expiryDate) {
      const currentExpiry = new Date(subscription.expiryDate);
      currentExpiry.setHours(0, 0, 0, 0);

      if (currentExpiry < today) {
        // Expired - extend from today
        newExpiryDate = new Date(today);
        newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
      } else {
        // Not expired - extend from current expiry
        newExpiryDate = new Date(currentExpiry);
        newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
      }
    } else {
      // No expiry date - extend from today
      newExpiryDate = new Date(today);
      newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
    }

    newExpiryDate.setHours(23, 59, 59, 999);

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        expiryDate: newExpiryDate,
        // If subscription was LOCKED or GRACE, reactivate it
        status: subscription.status === 'LOCKED' || subscription.status === 'GRACE' 
          ? (subscription.plan.name === 'TRIAL' ? 'TRIAL' : 'ACTIVE')
          : subscription.status,
      },
      include: {
        plan: true,
        society: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  } catch (error) {
    console.error('Error extending subscription:', error);
    throw error;
  }
};

/**
 * Extend subscription by society ID (extends latest subscription)
 */
export const extendSubscriptionBySociety = async (societyId, additionalDays) => {
  try {
    // Get latest subscription for society
    const subscription = await getSubscription(societyId);

    if (!subscription) {
      throw new Error('No subscription found for this society');
    }

    return await extendSubscription(subscription.id, additionalDays);
  } catch (error) {
    console.error('Error extending subscription by society:', error);
    throw error;
  }
};

