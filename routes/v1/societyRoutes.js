import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createSociety,
  getSocieties,
  getSocietyById,
  updateSociety,
  deleteSociety,
} from '../../controllers/v1/societyController.js';

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
const validateCreateSociety = [
  body('name').notEmpty().withMessage('Name is required'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['APARTMENT', 'OFFICE', 'apartment', 'office'])
    .withMessage('Type must be either "APARTMENT" or "OFFICE"'),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('state').optional().isString(),
  body('pincode').optional().isString(),
  body('subscriptionId').optional().isInt(),
  handleValidationErrors,
];

const validateUpdateSociety = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('type')
    .optional()
    .isIn(['APARTMENT', 'OFFICE'])
    .withMessage('Type must be either "APARTMENT" or "OFFICE"'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'EXPIRED', 'active', 'expired'])
    .withMessage('Status must be either "ACTIVE" or "EXPIRED"'),
  handleValidationErrors,
];

const validateSocietyId = [
  param('id').isInt().withMessage('Invalid society ID'),
  handleValidationErrors,
];

// Routes
// Swagger documentation is in config/swagger/paths/v1/society.js
router.post('/', authenticate, authorize('SUPER_ADMIN'), validateCreateSociety, createSociety);

router.get('/', authenticate, authorize('SUPER_ADMIN'), getSocieties);

router.get(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN', 'RESIDENT', 'SECURITY'),
  validateSocietyId,
  getSocietyById
);

router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'),
  validateSocietyId,
  validateUpdateSociety,
  updateSociety
);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), validateSocietyId, deleteSociety);

export default router;
