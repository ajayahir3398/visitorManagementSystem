import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getSocietySubscription,
  extendSubscriptionById,
  extendSubscriptionBySocietyId,
  getAllSubscriptions,
  getCurrentSubscription,
  buySubscription,
} from '../../controllers/v1/subscriptionController.js';

const router = express.Router();

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Validation middleware
const validateExtendSubscription = [
  body('additionalDays')
    .notEmpty()
    .withMessage('additionalDays is required')
    .isInt({ min: 1 })
    .withMessage('additionalDays must be a positive integer'),
  handleValidationErrors,
];

const validateSubscriptionId = [
  param('id').isInt().withMessage('Invalid subscription ID'),
  handleValidationErrors,
];

const validateSocietyId = [
  param('societyId').isInt().withMessage('Invalid society ID'),
  handleValidationErrors,
];

const validateBuySubscription = [
  body('planId')
    .notEmpty()
    .withMessage('planId is required')
    .isInt({ min: 1 })
    .withMessage('planId must be a positive integer'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/subscription.js

// Get current subscription (for logged-in society admin)
router.get('/current', authenticate, authorize('SOCIETY_ADMIN'), getCurrentSubscription);

// Buy/Activate subscription plan
router.post(
  '/buy',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateBuySubscription,
  buySubscription
);

// Get subscription by society ID
router.get(
  '/society/:societyId',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateSocietyId,
  getSocietySubscription
);

// Get all subscriptions (with filters)
router.get('/', authenticate, authorize('SUPER_ADMIN'), getAllSubscriptions);

// Extend subscription by subscription ID
router.post(
  '/:id/extend',
  authenticate,
  authorize('SUPER_ADMIN'),
  validateSubscriptionId,
  validateExtendSubscription,
  extendSubscriptionById
);

// Extend subscription by society ID
router.post(
  '/society/:societyId/extend',
  authenticate,
  authorize('SUPER_ADMIN'),
  validateSocietyId,
  validateExtendSubscription,
  extendSubscriptionBySocietyId
);

export default router;
