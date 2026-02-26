import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  login,
  requestOTP,
  verifyOTPLogin,
  refreshToken,
} from '../../controllers/v2/authController.js';

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

// Validation middleware
const validateLogin = [
  body('password').notEmpty().withMessage('Password is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('mobile')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  handleValidationErrors,
];

const validateOTP = [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  handleValidationErrors,
];

const validateVerifyOTP = [
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
  handleValidationErrors,
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/auth.js
router.post('/login', validateLogin, login);
router.post('/otp', validateOTP, requestOTP);
router.post('/verify-otp', validateVerifyOTP, verifyOTPLogin);
router.post('/refresh-token', validateRefreshToken, refreshToken);

export default router;
