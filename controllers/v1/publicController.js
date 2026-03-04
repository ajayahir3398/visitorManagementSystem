import { PublicService } from '../../services/publicService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const requestRegistrationOTP = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const data = await PublicService.requestRegistrationOTP(mobile);

  await logAction({
    user: null,
    action: AUDIT_ACTIONS.SOCIETY_SELF_REGISTRATION_OTP_SENT,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: null,
    description: `Society registration OTP sent to mobile ${mobile}`,
    req,
  });

  res.json({
    success: true,
    message: 'OTP sent successfully',
    data,
  });
});

export const registerSociety = asyncHandler(async (req, res) => {
  const { mobile, adminName } = req.body;
  const { result, accessToken, refreshToken } = await PublicService.registerSociety(req.body);

  await logAction({
    user: {
      id: result.user.id,
      role_name: result.user.role.name,
      society_id: result.society.id,
    },
    action: AUDIT_ACTIONS.SOCIETY_SELF_REGISTERED,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: result.society.id,
    description: `Society "${result.society.name}" self-registered by ${adminName} (${mobile}). Trial expires: ${result.subscription.expiryDate.toISOString().split('T')[0]}`,
    req,
  });

  try {
    const superAdminIds = await PublicService.getSuperAdminIds();

    if (superAdminIds.length > 0) {
      const title = '🏢 New Society Registered';
      const body = `"${result.society.name}" has just registered and started their 14-day trial. Admin: ${adminName}.`;

      await sendNotificationToUsers(superAdminIds, title, body, {
        type: 'NEW_SOCIETY_REGISTRATION',
        societyId: result.society.id.toString(),
      });
    }
  } catch (notifError) {
    console.error('Failed to send registration notification to Super Admins:', notifError);
  }

  res.status(201).json({
    success: true,
    message: 'Society registered successfully! Your 14-day trial has started.',
    data: {
      society: {
        id: result.society.id,
        name: result.society.name,
        type: result.society.type,
        city: result.society.city,
        source: result.society.source,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        mobile: result.user.mobile,
        email: result.user.email,
        society_id: result.user.societyId,
        role: result.user.role.name,
        status: result.user.status,
      },
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        plan: result.subscription.plan.name,
        startDate: result.subscription.startDate,
        expiryDate: result.subscription.expiryDate,
        trialDaysLeft: 14,
      },
      accessToken,
      refreshToken,
    },
  });
});
