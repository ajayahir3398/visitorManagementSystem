import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const getSubscription = async (societyId) => {
  if (!societyId) return null;

  return await prisma.subscription.findFirst({
    where: { societyId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const calculateSubscriptionStatus = (subscription) => {
  if (!subscription || !subscription.expiryDate) {
    return subscription?.status || 'LOCKED';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(subscription.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);

  if (subscription.status === 'SUSPENDED') return 'SUSPENDED';
  if (today <= expiryDate) return subscription.status;

  const daysSinceExpiry = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));
  if (daysSinceExpiry <= subscription.graceDays) return 'GRACE';

  return 'LOCKED';
};

export const updateSubscriptionStatus = async (subscription) => {
  if (!subscription) return null;

  const newStatus = calculateSubscriptionStatus(subscription);

  if (newStatus !== subscription.status) {
    return await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: newStatus },
      include: { plan: true },
    });
  }

  return subscription;
};

export const updateAllSubscriptionStatuses = async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: { not: 'SUSPENDED' }, expiryDate: { not: null } },
    include: { plan: true },
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
      console.error(`Error updating subscription ${subscription.id}:`, updateError.message);
    }
  }

  return { total: subscriptions.length, updated: updatedCount };
};

export const createTrialSubscription = async (societyId, durationDays = 60) => {
  let trialPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [{ code: 'TRIAL' }, { name: 'TRIAL' }, { name: 'Trial Plan' }],
      isActive: true,
    },
  });

  await fixSequence('subscription_plans');

  if (!trialPlan) {
    trialPlan = await prisma.subscriptionPlan.create({
      data: {
        code: 'TRIAL',
        name: 'Trial Plan',
        price: 0,
        durationMonths: 0,
        visitorLimit: null,
        features: { trial: true, duration_days: durationDays },
        isActive: true,
        billingCycle: 'MONTHLY',
      },
    });
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  expiryDate.setHours(23, 59, 59, 999);

  await fixSequence('subscriptions');
  return await prisma.subscription.create({
    data: { societyId, planId: trialPlan.id, status: 'TRIAL', startDate, expiryDate, graceDays: 3 },
    include: { plan: true },
  });
};

export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  return ['TRIAL', 'ACTIVE', 'GRACE'].includes(subscription.status);
};

export const extendSubscription = async (subscriptionId, additionalDays) => {
  if (!subscriptionId || !additionalDays || additionalDays <= 0) {
    throw { status: 400, message: 'Invalid subscription ID or extension days' };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, society: true },
  });

  if (!subscription) throw { status: 404, message: 'Subscription not found' };

  let newExpiryDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (subscription.expiryDate) {
    const currentExpiry = new Date(subscription.expiryDate);
    currentExpiry.setHours(0, 0, 0, 0);
    newExpiryDate = new Date(currentExpiry < today ? today : currentExpiry);
  } else {
    newExpiryDate = new Date(today);
  }

  newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
  newExpiryDate.setHours(23, 59, 59, 999);

  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      expiryDate: newExpiryDate,
      status:
        subscription.status === 'LOCKED' || subscription.status === 'GRACE'
          ? subscription.plan.name === 'TRIAL'
            ? 'TRIAL'
            : 'ACTIVE'
          : subscription.status,
    },
    include: { plan: true, society: { select: { id: true, name: true } } },
  });
};

export const extendSubscriptionBySociety = async (societyId, additionalDays) => {
  const subscription = await getSubscription(societyId);
  if (!subscription) throw { status: 404, message: 'No subscription found for this society' };
  return await extendSubscription(subscription.id, additionalDays);
};

export const checkSubscriptionExpiryAndNotify = async () => {
  console.log('--- Starting Subscription Expiry Check ---');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL', 'GRACE'] }, expiryDate: { not: null } },
      include: { society: true },
    });

    for (const subscription of subscriptions) {
      // Implementation from existing code remains same
      if (!subscription.expiryDate) continue;

      const expiryDate = new Date(subscription.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let notificationTitle = null;
      let notificationBody = null;

      if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
        notificationTitle = 'Subscription Expiring Soon';
        notificationBody = `Your society's subscription will expire in ${daysUntilExpiry} days. Please renew to avoid service interruption.`;
      } else if (daysUntilExpiry === 0) {
        notificationTitle = 'Subscription Expires Today';
        notificationBody = `Your society's subscription expires today. Please renew immediately.`;
      } else if (daysUntilExpiry === -1) {
        notificationTitle = 'Subscription Expired';
        notificationBody = `Your society's subscription has expired. You may be in a grace period. Please renew now.`;
      }

      if (notificationTitle && notificationBody) {
        const { sendNotificationToUsers } = await import('../utils/notificationHelper.js');

        const admins = await prisma.user.findMany({
          where: {
            societyId: subscription.societyId,
            role: { name: 'SOCIETY_ADMIN' },
            status: 'ACTIVE',
          },
          select: { id: true },
        });

        const adminIds = admins.map((a) => a.id);

        if (adminIds.length > 0) {
          console.log(
            `🔔 Sending subscription alert to ${adminIds.length} admins of society ${subscription.society.name} (Days: ${daysUntilExpiry})`
          );
          try {
            await sendNotificationToUsers(adminIds, notificationTitle, notificationBody, {
              type: 'subscription_alert',
              subscriptionId: subscription.id.toString(),
              daysRemaining: daysUntilExpiry.toString(),
            });
          } catch (notifError) {
            console.error(
              `Failed to send subscription alert for society ${subscription.societyId}:`,
              notifError
            );
          }
        }
      }
    }
    console.log('--- Subscription Expiry Check Completed ---');
  } catch (error) {
    console.error('Error in checkSubscriptionExpiryAndNotify:', error);
  }
};

export const getSocietySubscription = async ({ societyId, reqUser }) => {
  const societyIdInt = parseInt(societyId);
  if (isNaN(societyIdInt)) throw { status: 400, message: 'Invalid society ID' };

  if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== societyIdInt) {
    throw {
      status: 403,
      message: 'Access denied. You can only view your own society subscription.',
    };
  }

  let subscription = await getSubscription(societyIdInt);
  if (!subscription) throw { status: 404, message: 'No subscription found for this society' };

  subscription = await updateSubscriptionStatus(subscription);
  return subscription;
};

export const getAllSubscriptions = async ({ page = 1, limit = 10, status, societyId, planId }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (societyId) where.societyId = parseInt(societyId);
  if (planId) where.planId = parseInt(planId);

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { plan: true, society: { select: { id: true, name: true, type: true } } },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { subscriptions, total };
};

export const getCurrentSubscription = async ({ reqUser }) => {
  const societyId = reqUser.society_id;
  if (!societyId) throw { status: 400, message: 'User is not associated with a society' };

  let subscription = await getSubscription(societyId);
  if (!subscription) throw { status: 404, message: 'No subscription found for your society' };

  subscription = await updateSubscriptionStatus(subscription);
  return subscription;
};

export const buySubscription = async ({ planId, paymentMode, transactionId, reqUser }) => {
  const societyId = reqUser.society_id;
  if (!societyId) throw { status: 400, message: 'User is not associated with a society' };
  if (!planId) throw { status: 400, message: 'planId is required' };

  const mode = paymentMode || 'OFFLINE';
  const txId = transactionId || `TXN-REF-${Date.now()}`;
  const planIdInt = parseInt(planId);

  if (isNaN(planIdInt)) throw { status: 400, message: 'Invalid planId' };

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planIdInt } });
  if (!plan) throw { status: 404, message: 'Plan not found' };
  if (!plan.isActive) throw { status: 400, message: 'This plan is not available for purchase' };

  const startDate = new Date();
  let expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

  const existingSubscription = await prisma.subscription.findUnique({ where: { societyId } });

  let carriedOverDays = 0;
  if (
    existingSubscription &&
    existingSubscription.status === 'ACTIVE' &&
    existingSubscription.expiryDate > new Date()
  ) {
    const remainingTime = existingSubscription.expiryDate.getTime() - new Date().getTime();
    carriedOverDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
    if (carriedOverDays > 0) expiryDate.setDate(expiryDate.getDate() + carriedOverDays);
  }

  const payment = await prisma.payment.create({
    data: {
      societyId: societyId,
      amount: plan.price,
      gateway: 'MANUAL',
      paymentMode: mode,
      transactionId: txId,
      status: 'SUCCESS',
      paidAt: new Date(),
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: { societyId },
    update: { planId: plan.id, status: 'ACTIVE', startDate, expiryDate },
    create: { societyId, planId: plan.id, status: 'ACTIVE', startDate, expiryDate },
    include: { plan: true, society: { select: { id: true, name: true } } },
  });

  const invoiceNo = `INV-${societyId}-${Date.now()}`;
  await prisma.invoice.create({
    data: { societyId: societyId, paymentId: payment.id, invoiceNo: invoiceNo, amount: plan.price },
  });

  return { subscription, payment, plan, txId, existingSubscription };
};
