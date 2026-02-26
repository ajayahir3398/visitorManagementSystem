import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  getAllPlans,
  deletePlan,
} from '../../controllers/v1/planController.js';

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
const validatePlanId = [param('id').isInt().withMessage('Invalid plan ID'), handleValidationErrors];

const validateCreatePlan = [
  body('code')
    .notEmpty()
    .withMessage('code is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('code must be between 1 and 20 characters'),
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('name must be between 1 and 50 characters'),
  body('price')
    .notEmpty()
    .withMessage('price is required')
    .isInt({ min: 0 })
    .withMessage('price must be a non-negative integer'),
  body('durationMonths')
    .notEmpty()
    .withMessage('durationMonths is required')
    .isInt({ min: 1 })
    .withMessage('durationMonths must be a positive integer'),
  body('billingCycle')
    .notEmpty()
    .withMessage('billingCycle is required')
    .isIn(['MONTHLY', 'YEARLY'])
    .withMessage('billingCycle must be MONTHLY or YEARLY'),
  body('visitorLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('visitorLimit must be a positive integer'),
  handleValidationErrors,
];

// Public routes (no authentication)
router.get('/', getPlans);

// Super Admin route for getting all plans (including inactive)
// Must be defined before /:id to avoid route conflict
router.get('/all', authenticate, authorize('SUPER_ADMIN'), getAllPlans);

// Public route for getting a specific plan by ID
router.get('/:id', validatePlanId, getPlanById);

// Super Admin route for creating a new plan
router.post('/', authenticate, authorize('SUPER_ADMIN'), validateCreatePlan, createPlan);

// Super Admin route for updating a plan
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), validatePlanId, updatePlan);

// Super Admin route for toggling a plan's status
router.post(
  '/:id/toggle',
  authenticate,
  authorize('SUPER_ADMIN'),
  validatePlanId,
  togglePlanStatus
);

// Super Admin route for deleting a plan
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), validatePlanId, deletePlan);

export default router;
