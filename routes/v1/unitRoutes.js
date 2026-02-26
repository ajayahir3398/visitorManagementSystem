import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  bulkUploadUnits,
  addUnitMember,
  removeUnitMember,
} from '../../controllers/v1/unitController.js';

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
const validateCreateUnit = [
  body('unitNo').notEmpty().withMessage('unitNo is required').trim(),
  body('societyId')
    .notEmpty()
    .withMessage('societyId is required')
    .isInt()
    .withMessage('societyId must be an integer'),
  body('block').notEmpty().withMessage('block is required').isString().trim(),
  body('unitType').optional().isString().trim(),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE'),
  handleValidationErrors,
];

const validateUpdateUnit = [
  body('unitNo').optional().notEmpty().withMessage('unitNo cannot be empty').trim(),
  body('block').optional().notEmpty().withMessage('block cannot be empty').isString().trim(),
  body('unitType').optional().isString().trim(),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be ACTIVE or INACTIVE'),
  handleValidationErrors,
];

const validateUnitId = [param('id').isInt().withMessage('Invalid unit ID'), handleValidationErrors];

const validateAddMember = [
  body('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isInt()
    .withMessage('userId must be an integer'),
  body('role')
    .notEmpty()
    .withMessage('role is required')
    .isIn(['OWNER', 'TENANT', 'EMPLOYEE'])
    .withMessage('Role must be OWNER, TENANT, or EMPLOYEE'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
  handleValidationErrors,
];

const validateMemberId = [
  param('id').isInt().withMessage('Invalid unit ID'),
  param('memberId').isInt().withMessage('Invalid member ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/unit.js

// Bulk upload units (Society Admin only)
router.post('/bulk-upload', authenticate, authorize('SOCIETY_ADMIN'), bulkUploadUnits);

// Create unit
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateCreateUnit,
  createUnit
);

// Get all units
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'),
  getUnits
);

// Get unit by ID
router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'),
  validateUnitId,
  getUnitById
);

// Update unit
router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUnitId,
  validateUpdateUnit,
  updateUnit
);

// Delete unit
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUnitId,
  deleteUnit
);

// Add member to unit
router.post(
  '/:id/members',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateUnitId,
  validateAddMember,
  addUnitMember
);

// Remove member from unit
router.delete(
  '/:id/members/:memberId',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateMemberId,
  removeUnitMember
);

export default router;
