import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createMaintenancePlan,
  getMaintenancePlans,
  getMaintenancePlanById,
  updateMaintenancePlan,
  deleteMaintenancePlan,
} from '../../controllers/v1/maintenancePlanController.js';

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
const validateCreatePlan = [
  body('planType')
    .notEmpty()
    .withMessage('Plan type is required')
    .isIn(['MONTHLY', 'YEARLY'])
    .withMessage('Plan type must be MONTHLY or YEARLY'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  handleValidationErrors,
];

const validateUpdatePlan = [
  body('amount').optional().isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const validatePlanId = [param('id').isInt().withMessage('Invalid plan ID'), handleValidationErrors];

// Routes

/**
 * Create a new maintenance plan
 * POST /api/v1/maintenance-plans
 * Access: SOCIETY_ADMIN
 */
router.post(
  '/',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateCreatePlan,
  createMaintenancePlan
);

/**
 * Get all maintenance plans for the society
 * GET /api/v1/maintenance-plans
 * Access: SOCIETY_ADMIN, RESIDENT
 */
router.get('/', authenticate, authorize('SOCIETY_ADMIN', 'RESIDENT'), getMaintenancePlans);

/**
 * Get maintenance plan by ID
 * GET /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN, RESIDENT
 */
router.get(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN', 'RESIDENT'),
  validatePlanId,
  getMaintenancePlanById
);

/**
 * Update maintenance plan
 * PUT /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN
 */
router.put(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validatePlanId,
  validateUpdatePlan,
  updateMaintenancePlan
);

/**
 * Delete (deactivate) maintenance plan
 * DELETE /api/v1/maintenance-plans/:id
 * Access: SOCIETY_ADMIN
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validatePlanId,
  deleteMaintenancePlan
);

export default router;
