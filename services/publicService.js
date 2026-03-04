import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const PublicService = {
  requestRegistrationOTP: async (mobile) => {
    if (!mobile) throw { status: 400, message: 'Mobile number is required' };

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      throw { status: 400, message: 'Invalid mobile number format. Please provide 10 digits.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: { mobile, role: { name: 'SOCIETY_ADMIN' } },
      include: { role: true },
    });

    if (existingUser) {
      throw {
        status: 409,
        message:
          'This mobile number is already registered as a Society Admin. Please login instead.',
      };
    }

    const otpCode = generateOTP();
    await storeOTP(mobile, otpCode, 10);

    const isDevelopment = true;

    return {
      mobile,
      ...(isDevelopment && { otp: otpCode }),
      expiresIn: '10 minutes',
    };
  },

  registerSociety: async ({
    mobile,
    otp,
    societyName,
    societyType,
    city,
    adminName,
    email,
    password,
  }) => {
    if (!mobile || !otp) throw { status: 400, message: 'Mobile number and OTP are required' };
    if (!societyName || !societyType || !adminName)
      throw { status: 400, message: 'Society name, type, and admin name are required' };
    if (!password || password.length < 6)
      throw { status: 400, message: 'Password is required and must be at least 6 characters' };
    if (!['APARTMENT', 'OFFICE'].includes(societyType.toUpperCase())) {
      throw { status: 400, message: 'Society type must be either "APARTMENT" or "OFFICE"' };
    }

    const otpVerification = await verifyOTP(mobile, otp);
    if (!otpVerification.valid) throw { status: 400, message: otpVerification.message };

    const existingUser = await prisma.user.findFirst({
      where: { mobile, role: { name: 'SOCIETY_ADMIN' } },
    });

    if (existingUser)
      throw {
        status: 409,
        message: 'This mobile number is already registered as a Society Admin.',
      };

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail)
        throw {
          status: 409,
          message: 'This email is already registered. Please use a different email.',
        };
    }

    const societyAdminRole = await prisma.role.findUnique({ where: { name: 'SOCIETY_ADMIN' } });
    if (!societyAdminRole)
      throw { status: 500, message: 'Society Admin role not found. Please contact support.' };

    const trialPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [{ code: 'TRIAL' }, { name: { contains: 'TRIAL', mode: 'insensitive' } }],
        isActive: true,
      },
    });

    if (!trialPlan)
      throw { status: 500, message: 'Trial plan not available. Please contact support.' };

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      await fixSequence('societies');
      const society = await tx.society.create({
        data: {
          name: societyName,
          type: societyType.toUpperCase(),
          source: 'SELF_REGISTERED',
          city: city || null,
          status: 'ACTIVE',
        },
      });

      await fixSequence('gates');
      await tx.gate.create({ data: { societyId: society.id, name: 'Main Gate' } });

      await fixSequence('users');
      const user = await tx.user.create({
        data: {
          name: adminName,
          mobile,
          email: email || null,
          passwordHash,
          roleId: societyAdminRole.id,
          societyId: society.id,
          status: 'ACTIVE',
        },
        include: { role: true },
      });

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);

      await fixSequence('subscriptions');
      const subscription = await tx.subscription.create({
        data: {
          societyId: society.id,
          planId: trialPlan.id,
          status: 'TRIAL',
          startDate,
          expiryDate,
        },
        include: { plan: true },
      });

      return { society, user, subscription };
    });

    const tokenPayload = {
      userId: result.user.id,
      role: result.user.role.name,
      societyId: result.society.id,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await fixSequence('refresh_tokens');
    await prisma.refreshToken.create({
      data: { userId: result.user.id, token: refreshToken, expiresAt: refreshExpiresAt },
    });

    return { result, accessToken, refreshToken };
  },

  getSuperAdminIds: async () => {
    const superAdmins = await prisma.user.findMany({
      where: { role: { name: 'SUPER_ADMIN' }, isActive: true },
      select: { id: true },
    });
    return superAdmins.map((admin) => admin.id);
  },
};
