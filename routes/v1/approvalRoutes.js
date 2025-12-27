import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  approveVisitor,
  rejectVisitor,
  getPendingApprovals,
} from '../../controllers/v1/approvalController.js';

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
const validateVisitorLogId = [
  param('id').isInt().withMessage('Invalid visitor log ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/approval.js

// Get pending approvals
router.get(
  '/pending',
  authenticate,
  authorize('RESIDENT'),
  getPendingApprovals
);

// Approve visitor
router.post(
  '/visitor-logs/:id/approve',
  authenticate,
  authorize('RESIDENT'),
  validateVisitorLogId,
  approveVisitor
);

// Reject visitor
router.post(
  '/visitor-logs/:id/reject',
  authenticate,
  authorize('RESIDENT'),
  validateVisitorLogId,
  rejectVisitor
);

export default router;

