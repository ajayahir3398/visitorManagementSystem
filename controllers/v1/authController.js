import { AuthService } from '../../services/authService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await AuthService.login(req.body);

  await logAction({
    user: { id: user.id, role_name: user.role.name, society_id: user.societyId },
    action: AUDIT_ACTIONS.LOGIN,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `User logged in via password (${req.body.email})`,
    req,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role.name,
        society_id: user.societyId,
        status: user.status,
        photoBase64: user.photoBase64,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const requestOTP = asyncHandler(async (req, res) => {
  const { user, otpCode } = await AuthService.requestOTP(req.body);

  await logAction({
    user: { id: user.id, role_name: null, society_id: null },
    action: AUDIT_ACTIONS.OTP_SENT,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `OTP sent to mobile ${req.body.mobile}`,
    req,
  });

  const isDevelopment = true; // process.env.NODE_ENV === 'development';

  res.json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      mobile: req.body.mobile,
      ...(isDevelopment && { otp: otpCode }),
      expiresIn: '10 minutes',
    },
  });
});

export const verifyOTPLogin = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await AuthService.verifyOTPLogin(req.body);

  await logAction({
    user: { id: user.id, role_name: user.role.name, society_id: user.societyId },
    action: AUDIT_ACTIONS.OTP_VERIFIED,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `User logged in via OTP (mobile: ${req.body.mobile})`,
    req,
  });

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role.name,
        society_id: user.societyId,
        status: user.status,
        photoBase64: user.photoBase64,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { user, accessToken } = await AuthService.refreshToken(req.body);

  await logAction({
    user: { id: user.id, role_name: user.role.name, society_id: user.societyId },
    action: AUDIT_ACTIONS.TOKEN_REFRESHED,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: 'Access token refreshed',
    req,
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { user, isSingleDevice } = await AuthService.logout({
    userAuth: req.user,
    token: req.body.refreshToken,
  });

  await logAction({
    user,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: isSingleDevice
      ? 'User logged out (single device)'
      : 'User logged out from all devices',
    req,
  });

  res.json({
    success: true,
    message: isSingleDevice
      ? 'Logged out successfully'
      : 'Logged out from all devices successfully',
  });
});

export const logoutAll = asyncHandler(async (req, res) => {
  const { count } = await AuthService.logoutAll({ userId: req.user?.id });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: AUDIT_ENTITIES.USER,
    entityId: req.user.id,
    description: `User logged out from all devices (${count} session(s) invalidated)`,
    req,
  });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully',
    data: { sessionsInvalidated: count },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await AuthService.changePassword({
    userId: req.user?.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE_USER,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `User "${user.name}" changed their password`,
    req,
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});
