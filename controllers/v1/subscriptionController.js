import * as SubscriptionService from '../../services/subscriptionService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';
import prisma from '../../lib/prisma.js'; // Needed just for finding super admins

export const getSocietySubscription = asyncHandler(async (req, res) => {
  const subscription = await SubscriptionService.getSocietySubscription({
    societyId: req.params.societyId,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Subscription retrieved successfully',
    data: { subscription },
  });
});

export const extendSubscriptionById = asyncHandler(async (req, res) => {
  const { additionalDays } = req.body;
  if (!additionalDays || additionalDays <= 0 || !Number.isInteger(additionalDays)) {
    return res
      .status(400)
      .json({ success: false, message: 'additionalDays must be a positive integer' });
  }

  const updated = await SubscriptionService.extendSubscription(
    parseInt(req.params.id),
    additionalDays
  );

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
    entity: AUDIT_ENTITIES.SUBSCRIPTION,
    entityId: updated.id,
    description: `Subscription extended by ${additionalDays} days for society "${updated.society.name}" (Plan: ${updated.plan.name}, New expiry: ${updated.expiryDate?.toISOString().split('T')[0] || 'N/A'})`,
    req,
  });

  res.json({
    success: true,
    message: `Subscription extended by ${additionalDays} days successfully`,
    data: { subscription: updated },
  });
});

export const extendSubscriptionBySocietyId = asyncHandler(async (req, res) => {
  const { additionalDays } = req.body;
  const societyIdInt = parseInt(req.params.societyId);
  if (isNaN(societyIdInt))
    return res.status(400).json({ success: false, message: 'Invalid society ID' });
  if (!additionalDays || additionalDays <= 0 || !Number.isInteger(additionalDays)) {
    return res
      .status(400)
      .json({ success: false, message: 'additionalDays must be a positive integer' });
  }

  const updated = await SubscriptionService.extendSubscriptionBySociety(
    societyIdInt,
    additionalDays
  );

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
    entity: AUDIT_ENTITIES.SUBSCRIPTION,
    entityId: updated.id,
    description: `Subscription extended by ${additionalDays} days for society "${updated.society?.name || 'Unknown'}" (Plan: ${updated.plan.name}, New expiry: ${updated.expiryDate?.toISOString().split('T')[0] || 'N/A'})`,
    req,
  });

  res.json({
    success: true,
    message: `Subscription extended by ${additionalDays} days successfully`,
    data: { subscription: updated },
  });
});

export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { subscriptions, total } = await SubscriptionService.getAllSubscriptions(req.query);

  res.json({
    success: true,
    message: 'Subscriptions retrieved successfully',
    data: {
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const subscription = await SubscriptionService.getCurrentSubscription({ reqUser: req.user });

  res.json({
    success: true,
    message: 'Current subscription retrieved successfully',
    data: { subscription },
  });
});

export const buySubscription = asyncHandler(async (req, res) => {
  const { subscription, payment, plan, txId, existingSubscription } =
    await SubscriptionService.buySubscription({
      ...req.body,
      reqUser: req.user,
    });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SUBSCRIPTION_PURCHASED,
    entity: AUDIT_ENTITIES.SUBSCRIPTION,
    entityId: subscription.id,
    description: `Subscription purchased: ${plan.name} (${plan.code}) for society "${subscription.society.name}". Amount: ${plan.price}, TxId: ${txId}`,
    req,
  });

  try {
    const superAdmins = await prisma.user.findMany({
      where: { role: { name: 'SUPER_ADMIN' }, isActive: true },
      select: { id: true },
    });

    if (superAdmins.length > 0) {
      const superAdminIds = superAdmins.map((admin) => admin.id);
      const title = existingSubscription ? '💳 Plan Upgraded' : '🎉 New Subscription Purchased';
      const body = `Society "${subscription.society.name}" has just purchased the ${plan.name} (${plan.code}) plan for ₹${plan.price}.`;

      await sendNotificationToUsers(superAdminIds, title, body, {
        type: 'SUBSCRIPTION_UPDATE',
        societyId: req.user.society_id.toString(),
        planId: plan.id.toString(),
      });
    }
  } catch (notifError) {
    console.error('Failed to send notification to Super Admins:', notifError);
  }

  res.json({
    success: true,
    message: 'Subscription activated successfully',
    data: { subscription, payment },
  });
});
