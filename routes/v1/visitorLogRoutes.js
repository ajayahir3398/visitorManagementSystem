import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createVisitorEntry,
  markVisitorExit,
  getVisitorLogs,
  getVisitorLogById,
  getActiveEntries,
} from '../../controllers/v1/visitorLogController.js';

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
const validateCreateEntry = [
  body('visitorId')
    .notEmpty()
    .withMessage('visitorId is required')
    .isInt()
    .withMessage('visitorId must be an integer'),
  body('gateId')
    .notEmpty()
    .withMessage('gateId is required')
    .isInt()
    .withMessage('gateId must be an integer'),
  body('unitId').optional().isInt().withMessage('unitId must be an integer'),
  body('flatNo').optional().isString().trim(),
  body('purpose').optional().isString().trim(),
  body('photoBase64').optional().isString().withMessage('photoBase64 must be a string'),
  body('entryTime').optional().isISO8601().withMessage('entryTime must be a valid ISO 8601 date'),
  handleValidationErrors,
];

const validateExit = [
  body('exitTime').optional().isISO8601().withMessage('exitTime must be a valid ISO 8601 date'),
  handleValidationErrors,
];

const validateVisitorLogId = [
  param('id').isInt().withMessage('Invalid visitor log ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/visitorLog.js

// Create visitor entry
router.post('/', authenticate, authorize('SECURITY'), validateCreateEntry, createVisitorEntry);

// Mark visitor exit
router.put(
  '/:id/exit',
  authenticate,
  authorize('SECURITY'),
  validateVisitorLogId,
  validateExit,
  markVisitorExit
);

// Get active entries (visitors currently inside)
router.get(
  '/active',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY'),
  getActiveEntries
);

// Get all visitor logs
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'),
  getVisitorLogs
);

// Get visitor log by ID
router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'),
  validateVisitorLogId,
  getVisitorLogById
);

export default router;
