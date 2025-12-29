import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../../controllers/v1/userController.js';

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
const validateCreateUser = [
  body('name').notEmpty().withMessage('Name is required'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('societyId').optional().isInt().withMessage('Invalid society ID'),
  body('roleId').optional().isInt().withMessage('Invalid role ID'),
  body('status')
    .optional()
    .isIn(['active', 'blocked'])
    .withMessage('Status must be either "active" or "blocked"'),
  handleValidationErrors,
];

const validateUpdateUser = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('societyId').optional().isInt().withMessage('Invalid society ID'),
  body('roleId').optional().isInt().withMessage('Invalid role ID'),
  body('status')
    .optional()
    .isIn(['active', 'blocked'])
    .withMessage('Status must be either "active" or "blocked"'),
  handleValidationErrors,
];

const validateUserId = [
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/user.js
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN','SOCIETY_ADMIN'),
  validateCreateUser,
  createUser
);

router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  getUsers
);

router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUserId,
  getUserById
);

router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUserId,
  validateUpdateUser,
  updateUser
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUserId,
  deleteUser
);

export default router;

