import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { generateOTP, storeOTP, verifyOTP } from '../../utils/otp.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Login with email/mobile and password (for admins)
 * POST /auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required',
      });
    }

    // Find user by email or mobile
    const user = await prisma.user.findFirst({
      where: email ? { email } : { mobile },
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          photoBase64: user.photoBase64,
          role: user.role.name,
          society_id: user.societyId,
          status: user.status,
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true, status: true },
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

    // Generate and store OTP
    const otpCode = generateOTP();
    const otp = await storeOTP(mobile, otpCode, 10); // 10 minutes expiry

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll return it in development (remove in production)
    const isDevelopment = process.env.NODE_ENV === 'development';

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

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          photoBase64: user.photoBase64,
          role: user.role.name,
          society_id: user.societyId,
          status: user.status,
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
