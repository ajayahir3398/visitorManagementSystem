import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createGate,
  getGates,
  getGateById,
  updateGate,
  deleteGate,
} from '../../controllers/v1/gateController.js';

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
const validateCreateGate = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('societyId')
    .notEmpty()
    .withMessage('societyId is required')
    .isInt()
    .withMessage('societyId must be an integer'),
  handleValidationErrors,
];

const validateUpdateGate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  handleValidationErrors,
];

const validateGateId = [
  param('id').isInt().withMessage('Invalid gate ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/gate.js
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateCreateGate,
  createGate
);

router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY'),
  getGates
);

router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY'),
  validateGateId,
  getGateById
);

router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateGateId,
  validateUpdateGate,
  updateGate
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateGateId,
  deleteGate
);

export default router;

