import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createRule,
  getRules,
  getRuleById,
  updateRule,
  deleteRule,
} from '../../controllers/v1/ruleController.js';

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
const validateCreateRule = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title too long'),
  body('category').notEmpty().withMessage('Category is required'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high', 'Low', 'Medium', 'High'])
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const validateUpdateRule = [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title too long'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'low', 'medium', 'high', 'Low', 'Medium', 'High'])
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const validateRuleId = [param('id').isInt().withMessage('Invalid rule ID'), handleValidationErrors];

// Routes
router.post('/', authenticate, authorize('SOCIETY_ADMIN'), validateCreateRule, createRule);

router.get(
  '/',
  authenticate,
  // All authenticated users in the society can view rules
  getRules
);

router.get('/:id', authenticate, validateRuleId, getRuleById);

router.put(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateRuleId,
  validateUpdateRule,
  updateRule
);

router.delete('/:id', authenticate, authorize('SOCIETY_ADMIN'), validateRuleId, deleteRule);

export default router;
