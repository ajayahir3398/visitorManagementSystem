import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  searchVisitors,
} from '../../controllers/v1/visitorController.js';

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
const validateCreateVisitor = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('photoUrl').optional().isString().withMessage('photoUrl must be a string'),
  handleValidationErrors,
];

const validateUpdateVisitor = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('photoUrl').optional().isString().withMessage('photoUrl must be a string'),
  handleValidationErrors,
];

const validateVisitorId = [
  param('id').isInt().withMessage('Invalid visitor ID'),
  handleValidationErrors,
];

const validateSearch = [
  query('q').notEmpty().withMessage('Search query is required').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/visitor.js

// Create visitor
router.post(
  '/',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  validateCreateVisitor,
  createVisitor
);

// Get all visitors (with search)
router.get(
  '/',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  getVisitors
);

// Search visitors
router.get(
  '/search',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  validateSearch,
  searchVisitors
);

// Get visitor by ID
router.get(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  validateVisitorId,
  getVisitorById
);

// Update visitor
router.put(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  validateVisitorId,
  validateUpdateVisitor,
  updateVisitor
);

// Delete visitor
router.delete(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateVisitorId,
  deleteVisitor
);

export default router;

