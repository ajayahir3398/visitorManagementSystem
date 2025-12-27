import prisma from '../lib/prisma.js';

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in database
 */
export const storeOTP = async (mobile, otpCode, expiresInMinutes = 10) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  // Invalidate previous OTPs for this mobile
  await prisma.otp.updateMany({
    where: {
      mobile,
      verified: false,
    },
    data: {
      verified: true,
    },
  });

  // Insert new OTP
  const otp = await prisma.otp.create({
    data: {
      mobile,
      otpCode,
      expiresAt,
    },
  });

  return otp;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (mobile, otpCode) => {
  const otp = await prisma.otp.findFirst({
    where: {
      mobile,
      otpCode,
      verified: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otp) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as verified
  await prisma.otp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return { valid: true, otp };
};

/**
 * Clean expired OTPs (can be called periodically)
 */
export const cleanExpiredOTPs = async () => {
  await prisma.otp.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { verified: true },
      ],
    },
  });
};

