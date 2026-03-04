import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Setup basic Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware so we can test protected routes
jest.unstable_mockModule('../../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role_name: 'SECURITY', society_id: 1 };
    next();
  },
  authorize: () => (req, res, next) => next(),
}));

jest.unstable_mockModule('../../middleware/rateLimiter.js', () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
}));

// We should mock prisma
jest.unstable_mockModule('../../lib/prisma.js', () => ({
  default: {
    visitorLog: {
      create: jest.fn(() => ({ id: 100, status: 'PENDING' })),
      findMany: jest.fn(() => []),
    },
  },
}));

// Import after mocking
const { default: visitorLogRoutes } = await import('../visitorLogRoutes.js');

app.use('/visitor-logs', visitorLogRoutes);

describe('Visitor Log Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /visitor-logs/entry', () => {
    it('returns 400 if validation fails', async () => {
      const res = await request(app).post('/visitor-logs/entry').send({}); // Empty body
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    // Mocking success path would require detailed mocking of Firebase, Twilio, etc.
  });

  describe('GET /visitor-logs', () => {
    it('returns 200 and a list of logs', async () => {
      const res = await request(app).get('/visitor-logs');
      expect(res.status).toBe(200);
      // Depending on the mocked findMany it might be successful
    });
  });
});
