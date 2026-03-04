import express from 'express';
import { body, validationResult } from 'express-validator';
import { requestRegistrationOTP, registerSociety } from '../../controllers/v1/publicController.js';

const router = express.Router();

// Validation error handler middleware
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

// Validation middleware for OTP request
const validateRequestOTP = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  handleValidationErrors,
];

// Validation middleware for society registration
const validateRegisterSociety = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('societyName')
    .notEmpty()
    .withMessage('Society name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Society name must be between 2 and 255 characters'),
  body('societyType')
    .notEmpty()
    .withMessage('Society type is required')
    .isIn(['APARTMENT', 'OFFICE', 'APARTMENT', 'OFFICE'])
    .withMessage('Society type must be either "APARTMENT" or "OFFICE"'),
  body('adminName')
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Admin name must be between 2 and 255 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('city').optional().isLength({ max: 100 }).withMessage('City must be at most 100 characters'),
  handleValidationErrors,
];

// Routes - Public endpoints (no authentication required)

/**
 * Request OTP for society registration
 * POST /api/v1/public/society/request-otp
 */
router.post('/society/request-otp', validateRequestOTP, requestRegistrationOTP);

/**
 * Complete society self-registration
 * POST /api/v1/public/society/register
 */
router.post('/society/register', validateRegisterSociety, registerSociety);

export default router;
