import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createPreApproval,
  getPreApprovals,
  getPreApprovalById,
  revokePreApproval,
  verifyPreApprovalCode,
} from '../../controllers/v1/preApprovalController.js';

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
const validateCreatePreApproval = [
  body('unitId')
    .notEmpty()
    .withMessage('unitId is required')
    .isInt()
    .withMessage('unitId must be an integer'),
  body('guestName').optional().isString().trim(),
  body('guestMobile').optional().isString().trim(),
  body('validFrom')
    .notEmpty()
    .withMessage('validFrom is required')
    .isISO8601()
    .withMessage('validFrom must be a valid ISO 8601 date'),
  body('validTill')
    .notEmpty()
    .withMessage('validTill is required')
    .isISO8601()
    .withMessage('validTill must be a valid ISO 8601 date'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('maxUses must be at least 1'),
  handleValidationErrors,
];

const validateVerifyCode = [
  body('accessCode')
    .notEmpty()
    .withMessage('accessCode is required')
    .isString()
    .trim(),
  body('gateId')
    .notEmpty()
    .withMessage('gateId is required')
    .isInt()
    .withMessage('gateId must be an integer'),
  body('visitorId').optional().isInt().withMessage('visitorId must be an integer'),
  handleValidationErrors,
];

const validatePreApprovalId = [
  param('id').isInt().withMessage('Invalid pre-approval ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/preApproval.js

// RESIDENT routes
// Create pre-approval
router.post(
  '/',
  authenticate,
  authorize('RESIDENT'),
  validateCreatePreApproval,
  createPreApproval
);

// Get all pre-approvals
router.get(
  '/',
  authenticate,
  authorize('RESIDENT'),
  getPreApprovals
);

// Get pre-approval by ID
router.get(
  '/:id',
  authenticate,
  authorize('RESIDENT'),
  validatePreApprovalId,
  getPreApprovalById
);

// Revoke pre-approval
router.post(
  '/:id/revoke',
  authenticate,
  authorize('RESIDENT'),
  validatePreApprovalId,
  revokePreApproval
);

// SECURITY route
// Verify access code and create visitor entry
router.post(
  '/verify',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'),
  validateVerifyCode,
  verifyPreApprovalCode
);

export default router;


