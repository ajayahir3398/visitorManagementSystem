import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';

/**
 * Lock a Society
 * POST /api/v1/super-admin/society/:id/lock
 * Access: SUPER_ADMIN only
 */
export const lockSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: { subscriptions: true },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Update society status and subscription status in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.society.update({
        where: { id: societyId },
        data: { status: 'expired' },
      });

      // Lock the subscription if one exists
      if (society.subscriptions.length > 0) {
        await tx.subscription.updateMany({
          where: { societyId },
          data: { status: 'LOCKED' },
        });
      }
    });

    // Audit log
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SOCIETY_LOCKED,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: societyId,
      description: `Society "${society.name}" locked by Super Admin`,
      req,
    });

    res.json({
      success: true,
      message: `Society "${society.name}" has been locked successfully`,
      data: { societyId, status: 'LOCKED' },
    });
  } catch (error) {
    console.error('Lock society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock society',
      error: error.message,
    });
  }
};

/**
 * Unlock a Society
 * POST /api/v1/super-admin/society/:id/unlock
 * Access: SUPER_ADMIN only
 */
export const unlockSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: { subscriptions: true },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Update society status and subscription status in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.society.update({
        where: { id: societyId },
        data: { status: 'active' },
      });

      // Reactivate the subscription if one exists
      if (society.subscriptions.length > 0) {
        await tx.subscription.updateMany({
          where: { societyId },
          data: { status: 'ACTIVE' },
        });
      }
    });

    // Audit log
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SOCIETY_UNLOCKED,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: societyId,
      description: `Society "${society.name}" unlocked by Super Admin`,
      req,
    });

    res.json({
      success: true,
      message: `Society "${society.name}" has been unlocked successfully`,
      data: { societyId, status: 'ACTIVE' },
    });
  } catch (error) {
    console.error('Unlock society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock society',
      error: error.message,
    });
  }
};

/**
 * Extend Trial Period
 * POST /api/v1/super-admin/society/:id/extend-trial
 * Body: { days: number }
 * Access: SUPER_ADMIN only
 */
export const extendTrial = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);
    const { days } = req.body;

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    if (!days || days <= 0 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be a positive number between 1 and 365',
      });
    }

    // Find the subscription for this society
    const subscription = await prisma.subscription.findFirst({
      where: { societyId },
      include: { society: true },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for this society',
      });
    }

    // Calculate new expiry date
    const currentExpiry = subscription.expiryDate || new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        expiryDate: newExpiry,
        status: subscription.status === 'LOCKED' ? 'TRIAL' : subscription.status,
      },
    });

    // Also reactivate society if it was expired
    await prisma.society.update({
      where: { id: societyId },
      data: { status: 'active' },
    });

    // Audit log
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
      entity: AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscription.id,
      description: `Trial extended by ${days} days for society "${subscription.society.name}". New expiry: ${newExpiry.toISOString().split('T')[0]}`,
      req,
    });

    res.json({
      success: true,
      message: `Trial extended by ${days} days successfully`,
      data: {
        societyId,
        subscriptionId: updated.id,
        newExpiryDate: newExpiry,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend trial',
      error: error.message,
    });
  }
};
