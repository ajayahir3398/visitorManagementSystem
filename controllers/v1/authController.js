import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { generateOTP, storeOTP, verifyOTP } from '../../utils/otp.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Login with email/mobile and password (for admins)
 * POST /auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.',
      });
    }

    // Role-based restriction: Only admins can use password login
    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (!adminRoles.includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: `Password login is not available for ${user.role.name} role. Please use OTP login.`,
      });
    }

    // Check if user has password (admin only)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Password login not available. Please use OTP login.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Fix sequence if out of sync
    await fixSequence('refresh_tokens');

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Log login action
    await logAction({
      user: {
        id: user.id,
        role_name: user.role.name,
        society_id: user.societyId,
      },
      action: AUDIT_ACTIONS.LOGIN,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: `User logged in via password (${email || mobile})`,
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Request OTP
 * POST /auth/otp
 */
export const requestOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    // Validate mobile format (basic validation)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Please provide 10 digits.',
      });
    }

    // Check if user exists and get role
    const user = await prisma.user.findUnique({
      where: { mobile },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please contact administrator to register.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.',
      });
    }

    // Role-based restriction: Admins cannot use OTP login
    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (adminRoles.includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'OTP login is not available for administrator roles. Please use email and password login.',
      });
    }

    // Generate and store OTP
    const otpCode = generateOTP();
    const otp = await storeOTP(mobile, otpCode, 10); // 10 minutes expiry

    // Log OTP sent action
    await logAction({
      user: {
        id: user.id,
        role_name: null, // We don't have role info at this point
        society_id: null,
      },
      action: AUDIT_ACTIONS.OTP_SENT,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: `OTP sent to mobile ${mobile}`,
      req,
    });

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll return it in development (remove in production)
    const isDevelopment = true; // process.env.NODE_ENV === 'development';

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        mobile,
        // Only return OTP in development mode
        ...(isDevelopment && { otp: otpCode }),
        expiresIn: '10 minutes',
      },
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * Verify OTP and login
 * POST /auth/verify-otp
 */
export const verifyOTPLogin = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required',
      });
    }

    // Verify OTP
    const otpVerification = await verifyOTP(mobile, otp);

    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        message: otpVerification.message,
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { mobile },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact administrator.',
      });
    }

    // Role-based security check
    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (adminRoles.includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'OTP login is not available for administrator roles.',
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Fix sequence if out of sync
    await fixSequence('refresh_tokens');

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Log OTP verification and login
    await logAction({
      user: {
        id: user.id,
        role_name: user.role.name,
        society_id: user.societyId,
      },
      action: AUDIT_ACTIONS.OTP_VERIFIED,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: `User logged in via OTP (mobile: ${mobile})`,
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
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

/**
 * Refresh access token
 * POST /auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if user is still active
    if (tokenRecord.user.status !== 'active') {
      // Delete all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId },
      });

      return res.status(403).json({
        success: false,
        message: 'Account is blocked',
      });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token
    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    // Log token refresh
    await logAction({
      user: {
        id: user.id,
        role_name: user.role.name,
        society_id: user.societyId,
      },
      action: AUDIT_ACTIONS.TOKEN_REFRESHED,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: 'Access token refreshed',
      req,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid refresh token',
    });
  }
};

/**
 * Logout user (invalidate refresh token)
 * POST /auth/logout
 * Access: Authenticated users (via Bearer token) OR refreshToken in body
 * 
 * Supports two methods:
 * 1. Using access token in Authorization header (recommended)
 * 2. Using refreshToken in request body (fallback)
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    let userId;
    let user;

    // Method 1: User is authenticated via access token (req.user exists)
    if (req.user && req.user.id) {
      userId = req.user.id;
      user = {
        id: req.user.id,
        role_name: req.user.role_name,
        society_id: req.user.society_id,
      };

      // If refreshToken is provided, delete only that token
      // Otherwise, we'll delete all tokens for this user (logout from all devices)
      if (token) {
        // Verify refresh token belongs to this user
        try {
          const decoded = verifyRefreshToken(token);
          if (decoded.userId !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Refresh token does not belong to authenticated user',
            });
          }

          // Delete the specific refresh token
          const deleted = await prisma.refreshToken.deleteMany({
            where: {
              token,
              userId,
            },
          });

          if (deleted.count === 0) {
            return res.status(404).json({
              success: false,
              message: 'Refresh token not found or already invalidated',
            });
          }
        } catch (error) {
          // Token is invalid, but we can still log the logout attempt
          // Don't fail - user might have already logged out
        }
      } else {
        // No refreshToken provided - logout from all devices
        await prisma.refreshToken.deleteMany({
          where: { userId },
        });
      }
    }
    // Method 2: No access token, but refreshToken provided in body
    else if (token) {
      // Verify refresh token to get user info
      let decoded;
      try {
        decoded = verifyRefreshToken(token);
        userId = decoded.userId;
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token. Please provide a valid access token or refresh token.',
        });
      }

      // Delete the refresh token
      const deleted = await prisma.refreshToken.deleteMany({
        where: {
          token,
          userId,
        },
      });

      if (deleted.count === 0) {
        return res.status(404).json({
          success: false,
          message: 'Refresh token not found or already invalidated',
        });
      }

      // Get user for logging
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
        },
      });

      if (!userRecord) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user = {
        id: userRecord.id,
        role_name: userRecord.role.name,
        society_id: userRecord.societyId,
      };
    } else {
      // Neither access token nor refreshToken provided
      return res.status(400).json({
        success: false,
        message: 'Either provide Authorization header with access token, or refreshToken in request body',
      });
    }

    // Log logout action
    await logAction({
      user,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: AUDIT_ENTITIES.USER,
      entityId: userId,
      description: token ? 'User logged out (single device)' : 'User logged out from all devices',
      req,
    });

    res.json({
      success: true,
      message: token ? 'Logged out successfully' : 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: error.message,
    });
  }
};

/**
 * Logout from all devices (invalidate all refresh tokens)
 * POST /auth/logout-all
 * Access: Authenticated users only
 */
export const logoutAll = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userId = req.user.id;

    // Delete all refresh tokens for this user
    const deleted = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Log logout action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: AUDIT_ENTITIES.USER,
      entityId: userId,
      description: `User logged out from all devices (${deleted.count} session(s) invalidated)`,
      req,
    });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
      data: {
        sessionsInvalidated: deleted.count,
      },
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
      error: error.message,
    });
  }
};

/**
 * Change own password
 * PUT /api/v1/auth/change-password
 * Access: Authenticated users only
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({
        success: false,
        message: 'User not found or password not set',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Log action
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
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

