import { SuperAdminActionService } from '../../services/superAdminActionService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Lock a Society
 */
export const lockSociety = asyncHandler(async (req, res) => {
  const societyId = parseInt(req.params.id);
  const { societyName } = await SuperAdminActionService.lockSociety(societyId);

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SOCIETY_LOCKED,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: societyId,
    description: `Society "${societyName}" locked by Super Admin`,
    req,
  });

  res.json({
    success: true,
    message: `Society "${societyName}" has been locked successfully`,
    data: { societyId, status: 'LOCKED' },
  });
});

/**
 * Unlock a Society
 */
export const unlockSociety = asyncHandler(async (req, res) => {
  const societyId = parseInt(req.params.id);
  const { societyName, newStatus } = await SuperAdminActionService.unlockSociety(societyId);

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SOCIETY_UNLOCKED,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: societyId,
    description: `Society "${societyName}" unlocked by Super Admin`,
    req,
  });

  res.json({
    success: true,
    message: `Society "${societyName}" has been unlocked successfully`,
    data: { societyId, status: newStatus },
  });
});

/**
 * Extend Subscription
 */
export const extendSubscription = asyncHandler(async (req, res) => {
  const societyId = parseInt(req.params.id);
  const { days } = req.body;

  const { subscriptionId, societyName, planCode, newExpiry, newStatus } =
    await SuperAdminActionService.extendSubscription(societyId, days);

  const actionDesc =
    planCode === 'TRIAL'
      ? `Trial extended by ${days} days`
      : `Subscription extended by ${days} days`;

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
    entity: AUDIT_ENTITIES.SUBSCRIPTION,
    entityId: subscriptionId,
    description: `${actionDesc} for society "${societyName}". New expiry: ${newExpiry.toISOString().split('T')[0]}`,
    req,
  });

  res.json({
    success: true,
    message: `${actionDesc} successfully`,
    data: {
      societyId,
      subscriptionId,
      newExpiryDate: newExpiry,
      status: newStatus,
    },
  });
});
