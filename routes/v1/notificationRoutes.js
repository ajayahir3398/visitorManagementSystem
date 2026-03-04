import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate } from '../../middleware/auth.js';
import {
  registerToken,
  removeToken,
  sendNotificationToUser,
  sendBulkNotification,
  sendNotificationByRole,
  sendNotificationBySociety,
  getUserTokens,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../../controllers/v1/notificationController.js';

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
const validateRegisterToken = [
  body('token').notEmpty().withMessage('FCM token is required'),
  body('deviceId').optional().isString().withMessage('Device ID must be a string'),
  body('platform')
    .optional()
    .isIn(['ANDROID', 'IOS', 'android', 'ios'])
    .withMessage('Platform must be android or ios'),
  handleValidationErrors,
];

const validateRemoveToken = [
  body('token').notEmpty().withMessage('FCM token is required'),
  handleValidationErrors,
];

const validateSendNotification = [
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('userId').optional().isInt().withMessage('User ID must be an integer'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  handleValidationErrors,
];

const validateBulkNotification = [
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error('All user IDs must be positive integers');
      }
      return true;
    }),
  body('data').optional().isObject().withMessage('Data must be an object'),
  handleValidationErrors,
];

const validateNotificationByRole = [
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'])
    .withMessage('Invalid role'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  handleValidationErrors,
];

const validateNotificationBySociety = [
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('societyId').optional().isInt().withMessage('Society ID must be an integer'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  handleValidationErrors,
];

const validateGetUserTokens = [
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in swagger/paths/v1/notifications.js

// Register/Update FCM Token
router.post('/register-token', authenticate, validateRegisterToken, registerToken);

// Remove FCM Token
router.delete('/remove-token', authenticate, validateRemoveToken, removeToken);

// Get user's FCM tokens
router.get('/tokens', authenticate, validateGetUserTokens, getUserTokens);

// Send notification to a single user
router.post('/send', authenticate, validateSendNotification, sendNotificationToUser);

// Send notification to multiple users (Admin only)
router.post('/send-bulk', authenticate, validateBulkNotification, sendBulkNotification);

// Send notification by role (Admin only)
router.post('/send-by-role', authenticate, validateNotificationByRole, sendNotificationByRole);

// Send notification by society (Admin only)
router.post(
  '/send-by-society',
  authenticate,
  validateNotificationBySociety,
  sendNotificationBySociety
);

// Get user's notifications
router.get('/', authenticate, getNotifications);

// Get unread count
router.get('/unread-count', authenticate, getUnreadCount);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllAsRead);

// Mark notification as read
router.put('/:id/read', authenticate, markAsRead);

export default router;
