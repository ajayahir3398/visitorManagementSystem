import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../authRoutes.js';

// Setup basic Express app for testing
const app = express();
app.use(express.json());
// Mock rate limiter to avoid blocking tests
jest.unstable_mockModule('../../middleware/rateLimiter.js', () => ({
  authLimiter: (req, res, next) => next(),
}));
// Assuming mock logger is already handled or not blocking
app.use('/auth', authRoutes);

// We should mock prisma
jest.unstable_mockModule('../../lib/prisma.js', () => ({
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

// We must also mock bcrypt and jwt for isolated integration tests
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule('../../utils/jwt.js', () => ({
  generateAccessToken: jest.fn(() => 'mockAccessToken'),
  generateRefreshToken: jest.fn(() => 'mockRefreshToken'),
}));

jest.unstable_mockModule('../../utils/otp.js', () => ({
  generateOTP: jest.fn(() => '123456'),
  storeOTP: jest.fn(),
  verifyOTP: jest.fn(),
}));

jest.unstable_mockModule('../../utils/auditLogger.js', () => ({
  logAction: jest.fn(),
  AUDIT_ACTIONS: {},
  AUDIT_ENTITIES: {},
}));

describe('Auth Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('returns 400 if email or password is missing', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    // To do a full success test, we would need to mock the resolved values of imported modules
    // Since we are using ESM and jest.unstable_mockModule, we have to import them dynamically after mocking
  });
});
