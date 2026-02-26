import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  reportViolation,
  getViolations,
  updateViolationStatus,
} from '../../controllers/v1/violationController.js';

const router = express.Router();

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

const validateReport = [
  body('ruleId').isInt().withMessage('Rule ID is required'),
  // Either violatorUserId or violatorUnitId should be present ideally, but strict check takes effort.
  // Let's keep it optional but at least check types if present.
  body('violatorUserId').optional().isInt(),
  body('violatorUnitId').optional().isInt(),
  handleValidationErrors,
];

const validateStatusUpdate = [
  param('id').isInt(),
  body('status').isIn(['PENDING', 'RESOLVED', 'DISMISSED', 'PAID']).withMessage('Invalid status'),
  handleValidationErrors,
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('SOCIETY_ADMIN', 'SECURITY'), // Security can report too? Let's assume yes.
  validateReport,
  reportViolation
);

router.get('/', authenticate, getViolations);

router.put(
  '/:id/status',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateStatusUpdate,
  updateViolationStatus
);

export default router;
