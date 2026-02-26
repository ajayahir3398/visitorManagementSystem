import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { generateOTP, storeOTP, verifyOTP } from '../../utils/otp.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';

/**
 * Request OTP for society registration
 * POST /public/society/request-otp
 * Access: Public (no authentication required)
 */
export const requestRegistrationOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    // Validate mobile format (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Please provide 10 digits.',
      });
    }

    // Check if mobile is already registered as SOCIETY_ADMIN
    const existingUser = await prisma.user.findFirst({
      where: {
        mobile,
        role: {
          name: 'SOCIETY_ADMIN',
        },
      },
      include: {
        role: true,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'This mobile number is already registered as a Society Admin. Please login instead.',
      });
    }

    // Generate and store OTP
    const otpCode = generateOTP();
    await storeOTP(mobile, otpCode, 10); // 10 minutes expiry

    // Log OTP sent action
    await logAction({
      user: null,
      action: AUDIT_ACTIONS.SOCIETY_SELF_REGISTRATION_OTP_SENT,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: null,
      description: `Society registration OTP sent to mobile ${mobile}`,
      req,
    });

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
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
    console.error('Registration OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * Complete society self-registration
 * POST /public/society/register
 * Access: Public (no authentication required)
 *
 * This endpoint:
 * 1. Verifies OTP
 * 2. Creates Society with source=SELF_REGISTERED
 * 3. Creates Society Admin user with password
 * 4. Assigns Trial subscription (14 days)
 * 5. Returns auth tokens for immediate login
 */
export const registerSociety = async (req, res) => {
  try {
    const { mobile, otp, societyName, societyType, city, adminName, email, password } = req.body;

    // Validation
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required',
      });
    }

    if (!societyName || !societyType || !adminName) {
      return res.status(400).json({
        success: false,
        message: 'Society name, type, and admin name are required',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters',
      });
    }

    if (!['apartment', 'office'].includes(societyType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Society type must be either "apartment" or "office"',
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

    // Double-check mobile is not already a society admin
    const existingUser = await prisma.user.findFirst({
      where: {
        mobile,
        role: {
          name: 'SOCIETY_ADMIN',
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered as a Society Admin.',
      });
    }

    // Check if email is already in use (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'This email is already registered. Please use a different email.',
        });
      }
    }

    // Get SOCIETY_ADMIN role
    const societyAdminRole = await prisma.role.findUnique({
      where: { name: 'SOCIETY_ADMIN' },
    });

    if (!societyAdminRole) {
      return res.status(500).json({
        success: false,
        message: 'Society Admin role not found. Please contact support.',
      });
    }

    // Get TRIAL plan
    const trialPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [{ code: 'TRIAL' }, { name: { contains: 'trial', mode: 'insensitive' } }],
        isActive: true,
      },
    });

    if (!trialPlan) {
      return res.status(500).json({
        success: false,
        message: 'Trial plan not available. Please contact support.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create society, user, and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fix sequences
      await fixSequence('societies');

      // 1. Create Society
      const society = await tx.society.create({
        data: {
          name: societyName,
          type: societyType.toLowerCase(),
          source: 'SELF_REGISTERED',
          city: city || null,
          status: 'active',
        },
      });

      // 1.1 Create Default Main Gate
      await fixSequence('gates');
      await tx.gate.create({
        data: {
          societyId: society.id,
          name: 'Main Gate',
        },
      });

      // Fix user sequence
      await fixSequence('users');

      // 2. Create Society Admin user
      const user = await tx.user.create({
        data: {
          name: adminName,
          mobile,
          email: email || null,
          passwordHash,
          roleId: societyAdminRole.id,
          societyId: society.id,
          status: 'active',
        },
        include: {
          role: true,
        },
      });

      // 3. Create Trial Subscription (14 days)
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14); // 14 days trial

      // Fix subscription sequence
      await fixSequence('subscriptions');

      const subscription = await tx.subscription.create({
        data: {
          societyId: society.id,
          planId: trialPlan.id,
          status: 'TRIAL',
          startDate,
          expiryDate,
        },
        include: {
          plan: true,
        },
      });

      return { society, user, subscription };
    });

    // Generate tokens for immediate login
    const tokenPayload = {
      userId: result.user.id,
      role: result.user.role.name,
      societyId: result.society.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

    await fixSequence('refresh_tokens');
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    // Log society registration
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

    // Send push notification to all Super Admins about new registration
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: { name: 'SUPER_ADMIN' }, isActive: true },
        select: { id: true },
      });

      if (superAdmins.length > 0) {
        const superAdminIds = superAdmins.map((admin) => admin.id);
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
  } catch (error) {
    console.error('Society registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register society',
      error: error.message,
    });
  }
};
