import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
} from '../../controllers/v1/auditLogController.js';

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
const validateGetAuditLogs = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('entity').optional().isString().withMessage('Entity must be a string'),
  query('userId').optional().isInt({ min: 1 }).withMessage('UserId must be a positive integer'),
  query('societyId').optional().isInt({ min: 1 }).withMessage('SocietyId must be a positive integer'),
  query('role').optional().isString().withMessage('Role must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

const validateGetAuditLogById = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  handleValidationErrors,
];

const validateGetAuditLogStats = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

/**
 * @route   GET /api/v1/audit-logs
 * @desc    Get audit logs (Super Admin: all, Society Admin: own society)
 * @access  SUPER_ADMIN, SOCIETY_ADMIN
 */
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateGetAuditLogs,
  getAuditLogs
);

/**
 * @route   GET /api/v1/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  SUPER_ADMIN, SOCIETY_ADMIN
 */
router.get(
  '/stats',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateGetAuditLogStats,
  getAuditLogStats
);

/**
 * @route   GET /api/v1/audit-logs/:id
 * @desc    Get audit log by ID
 * @access  SUPER_ADMIN, SOCIETY_ADMIN
 */
router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateGetAuditLogById,
  getAuditLogById
);

export default router;


