import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import {
  login,
  requestOTP,
  verifyOTPLogin,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
} from '../../controllers/v1/authController.js';

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
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
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

const validateLogout = [
  body('refreshToken')
    .optional()
    .notEmpty()
    .withMessage('Refresh token must not be empty if provided'),
  handleValidationErrors,
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/auth.js
router.post('/login', validateLogin, login);
router.post('/otp', validateOTP, requestOTP);
router.post('/verify-otp', validateVerifyOTP, verifyOTPLogin);
router.post('/refresh-token', validateRefreshToken, refreshToken);

// Logout routes
// logout: Can use either access token (recommended) or refreshToken in body
// optionalAuthenticate allows both methods - sets req.user if token exists, continues if not
router.post('/logout', optionalAuthenticate, validateLogout, logout);
// logout-all: Requires authentication, logs out from all devices
router.post('/logout-all', authenticate, logoutAll);

router.put(
  '/change-password',
  authenticate,
  validateChangePassword,
  changePassword
);

export default router;

