import prisma from '../../lib/prisma.js';
import {
  getSubscription,
  extendSubscription,
  extendSubscriptionBySociety,
  updateSubscriptionStatus,
} from '../../services/subscriptionService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';

/**
 * Get subscription for a society
 * GET /api/v1/subscriptions/society/:societyId
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const getSocietySubscription = async (req, res) => {
  try {
    const { societyId } = req.params;
    const societyIdInt = parseInt(societyId);

    if (isNaN(societyIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // If user is SOCIETY_ADMIN, only allow access to their own society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== societyIdInt) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own society subscription.',
      });
    }

    let subscription = await getSubscription(societyIdInt);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for this society',
      });
    }

    // Auto-update status
    subscription = await updateSubscriptionStatus(subscription);

    res.json({
      success: true,
      message: 'Subscription retrieved successfully',
      data: { subscription },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription',
      error: error.message,
    });
  }
};

/**
 * Extend subscription period
 * POST /api/v1/subscriptions/:id/extend
 * Access: SUPER_ADMIN only
 */
export const extendSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalDays } = req.body;

    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID',
      });
    }

    if (!additionalDays || additionalDays <= 0 || !Number.isInteger(additionalDays)) {
      return res.status(400).json({
        success: false,
        message: 'additionalDays must be a positive integer',
      });
    }

    // Get subscription before extending to log details
    const subscriptionBefore = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
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

    const updated = await extendSubscription(subscriptionId, additionalDays);

    // Log subscription extension
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
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extend subscription',
    });
  }
};

/**
 * Extend subscription by society ID
 * POST /api/v1/subscriptions/society/:societyId/extend
 * Access: SUPER_ADMIN only
 */
export const extendSubscriptionBySocietyId = async (req, res) => {
  try {
    const { societyId } = req.params;
    const { additionalDays } = req.body;

    const societyIdInt = parseInt(societyId);

    if (isNaN(societyIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    if (!additionalDays || additionalDays <= 0 || !Number.isInteger(additionalDays)) {
      return res.status(400).json({
        success: false,
        message: 'additionalDays must be a positive integer',
      });
    }

    // Get society before extending to log details
    const society = await prisma.society.findUnique({
      where: { id: societyIdInt },
      select: {
        id: true,
        name: true,
      },
    });

    const updated = await extendSubscriptionBySociety(societyIdInt, additionalDays);

    // Log subscription extension
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: updated.id,
      description: `Subscription extended by ${additionalDays} days for society "${society?.name || 'Unknown'}" (Plan: ${updated.plan.name}, New expiry: ${updated.expiryDate?.toISOString().split('T')[0] || 'N/A'})`,
      req,
    });

    res.json({
      success: true,
      message: `Subscription extended by ${additionalDays} days successfully`,
      data: { subscription: updated },
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extend subscription',
    });
  }
};

/**
 * Get all subscriptions (with filters)
 * GET /api/v1/subscriptions
 * Access: SUPER_ADMIN only
 */
export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, societyId, planId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
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
        include: {
          plan: true,
          society: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscriptions',
      error: error.message,
    });
  }
};

/**
 * Get current subscription for logged-in society admin
 * GET /api/v1/subscriptions/current
 * Access: SOCIETY_ADMIN only
 */
export const getCurrentSubscription = async (req, res) => {
  try {
    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with a society',
      });
    }

    let subscription = await getSubscription(societyId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for your society',
      });
    }

    // Auto-update status
    subscription = await updateSubscriptionStatus(subscription);

    res.json({
      success: true,
      message: 'Current subscription retrieved successfully',
      data: { subscription },
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current subscription',
      error: error.message,
    });
  }
};

/**
 * Buy/Activate a subscription plan
 * POST /api/v1/subscriptions/buy
 * Access: SOCIETY_ADMIN only
 * 
 * Note: This is MVP version without payment gateway integration.
 * Payment gateway (Razorpay) can be integrated later.
 */
export const buySubscription = async (req, res) => {
  try {
    const { planId, paymentMode, transactionId } = req.body;
    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with a society',
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'planId is required',
      });
    }

    // Default to CASH/OFFLINE if no mode provided in MVP
    const mode = paymentMode || 'OFFLINE';
    const txId = transactionId || `TXN-REF-${Date.now()}`;

    const planIdInt = parseInt(planId);
    if (isNaN(planIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid planId',
      });
    }

    // Validate plan exists and is active
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planIdInt },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This plan is not available for purchase',
      });
    }

    // Calculate dates
    const startDate = new Date();
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

    // Check for existing active subscription to carry over days
    const existingSubscription = await prisma.subscription.findUnique({
      where: { societyId }
    });

    let carriedOverDays = 0;
    if (existingSubscription && existingSubscription.status === 'ACTIVE' && existingSubscription.expiryDate > new Date()) {
      const remainingTime = existingSubscription.expiryDate.getTime() - new Date().getTime();
      carriedOverDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

      if (carriedOverDays > 0) {
        // Add remaining days to the new expiry date
        expiryDate.setDate(expiryDate.getDate() + carriedOverDays);
      }
    }

    // 1. Create Payment Record first
    const payment = await prisma.payment.create({
      data: {
        societyId: societyId,
        amount: plan.price,
        gateway: 'MANUAL', // Or logic to detect gateway if integrated
        paymentMode: mode,
        transactionId: txId,
        status: 'SUCCESS', // Assume success for this flow
        paidAt: new Date()
      }
    });

    // 2. Upsert Subscription
    const subscription = await prisma.subscription.upsert({
      where: { societyId },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        expiryDate,
      },
      create: {
        societyId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        expiryDate,
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

    // 3. Generate Invoice
    const invoiceNo = `INV-${societyId}-${Date.now()}`;
    await prisma.invoice.create({
      data: {
        societyId: societyId,
        paymentId: payment.id,
        invoiceNo: invoiceNo,
        amount: plan.price
      }
    });

    // Log subscription purchase
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SUBSCRIPTION_PURCHASED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscription.id,
      description: `Subscription purchased: ${plan.name} (${plan.code}) for society "${subscription.society.name}". Amount: ${plan.price}, TxId: ${txId}`,
      req,
    });

    // Send push notification to all Super Admins
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
          societyId: societyId.toString(),
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
  } catch (error) {
    console.error('Buy subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate subscription',
      error: error.message,
    });
  }
};

