import express from 'express';
import { param, body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  lockSociety,
  unlockSociety,
  extendTrial,
} from '../../controllers/v1/superAdminActionController.js';

const router = express.Router();

// All routes require SUPER_ADMIN authentication
router.use(authenticate, authorize('SUPER_ADMIN'));

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
const validateSocietyId = [
  param('id').isInt().withMessage('Invalid society ID'),
  handleValidationErrors,
];

const validateExtendTrial = [
  param('id').isInt().withMessage('Invalid society ID'),
  body('days')
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  handleValidationErrors,
];

// Quick action routes
router.post('/:id/lock', validateSocietyId, lockSociety);
router.post('/:id/unlock', validateSocietyId, unlockSociety);
router.post('/:id/extend-trial', validateExtendTrial, extendTrial);

export default router;
