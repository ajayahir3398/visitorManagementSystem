import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const AuthService = {
  login: async ({ email, password }) => {
    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required' };
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
      throw { status: 403, message: 'Account is blocked. Please contact administrator.' };
    }

    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (!adminRoles.includes(user.role.name)) {
      throw {
        status: 403,
        message: `Password login is not available for ${user.role.name} role. Please use OTP login.`,
      };
    }

    if (!user.passwordHash) {
      throw { status: 401, message: 'Password login not available. Please use OTP login.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await fixSequence('refresh_tokens');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { user, accessToken, refreshToken };
  },

  requestOTP: async ({ mobile }) => {
    if (!mobile) {
      throw { status: 400, message: 'Mobile number is required' };
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      throw { status: 400, message: 'Invalid mobile number format. Please provide 10 digits.' };
    }

    const user = await prisma.user.findUnique({
      where: { mobile },
      include: { role: true },
    });

    if (!user) {
      throw { status: 404, message: 'User not found. Please contact administrator to register.' };
    }

    if (user.status !== 'ACTIVE') {
      throw { status: 403, message: 'Account is blocked. Please contact administrator.' };
    }

    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (adminRoles.includes(user.role.name)) {
      throw {
        status: 403,
        message:
          'OTP login is not available for administrator roles. Please use email and password login.',
      };
    }

    const otpCode = generateOTP();
    await storeOTP(mobile, otpCode, 10);

    return { user, otpCode };
  },

  verifyOTPLogin: async ({ mobile, otp }) => {
    if (!mobile || !otp) {
      throw { status: 400, message: 'Mobile number and OTP are required' };
    }

    const otpVerification = await verifyOTP(mobile, otp);
    if (!otpVerification.valid) {
      throw { status: 400, message: otpVerification.message };
    }

    const user = await prisma.user.findUnique({
      where: { mobile },
      include: { role: true },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    if (user.status !== 'ACTIVE') {
      throw { status: 403, message: 'Account is blocked. Please contact administrator.' };
    }

    const adminRoles = ['SOCIETY_ADMIN', 'SUPER_ADMIN'];
    if (adminRoles.includes(user.role.name)) {
      throw { status: 403, message: 'OTP login is not available for administrator roles.' };
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await fixSequence('refresh_tokens');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { user, accessToken, refreshToken };
  },

  refreshToken: async ({ token }) => {
    if (!token) {
      throw { status: 400, message: 'Refresh token is required' };
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    if (tokenRecord.user.status !== 'ACTIVE') {
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId },
      });
      throw { status: 403, message: 'Account is blocked' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      societyId: user.societyId,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return { user, accessToken };
  },

  logout: async ({ userAuth, token }) => {
    let userId;
    let user;
    let isSingleDevice = false;

    if (userAuth && userAuth.id) {
      userId = userAuth.id;
      user = { id: userAuth.id, role_name: userAuth.role_name, society_id: userAuth.society_id };

      if (token) {
        try {
          const decoded = verifyRefreshToken(token);
          if (decoded.userId !== userId) {
            throw { status: 403, message: 'Refresh token does not belong to authenticated user' };
          }

          const deleted = await prisma.refreshToken.deleteMany({
            where: { token, userId },
          });

          if (deleted.count === 0) {
            throw { status: 404, message: 'Refresh token not found or already invalidated' };
          }
          isSingleDevice = true;
        } catch (error) {
          if (error.status) throw error; // Re-throw custom errors
        }
      } else {
        await prisma.refreshToken.deleteMany({ where: { userId } });
      }
    } else if (token) {
      let decoded;
      try {
        decoded = verifyRefreshToken(token);
        userId = decoded.userId;
      } catch {
        throw {
          status: 401,
          message: 'Invalid refresh token. Please provide a valid access token or refresh token.',
        };
      }

      const deleted = await prisma.refreshToken.deleteMany({
        where: { token, userId },
      });

      if (deleted.count === 0) {
        throw { status: 404, message: 'Refresh token not found or already invalidated' };
      }

      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!userRecord) {
        throw { status: 404, message: 'User not found' };
      }

      user = {
        id: userRecord.id,
        role_name: userRecord.role.name,
        society_id: userRecord.societyId,
      };
      isSingleDevice = true;
    } else {
      throw {
        status: 400,
        message:
          'Either provide Authorization header with access token, or refreshToken in request body',
      };
    }

    return { user, isSingleDevice };
  },

  logoutAll: async ({ userId }) => {
    if (!userId) {
      throw { status: 401, message: 'Authentication required' };
    }

    const deleted = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { count: deleted.count };
  },

  changePassword: async ({ userId, currentPassword, newPassword }) => {
    if (!currentPassword || !newPassword) {
      throw { status: 400, message: 'Current password and new password are required' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw { status: 404, message: 'User not found or password not set' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { status: 400, message: 'Incorrect current password' };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return user;
  },
};
