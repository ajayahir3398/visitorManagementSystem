import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createNotice,
  getNotices,
  getNoticeById,
  markNoticeRead,
  updateNotice,
  deactivateNotice,
} from '../../controllers/v1/noticeController.js';

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
const validateCreateNotice = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('noticeType')
    .notEmpty()
    .withMessage('Notice type is required')
    .isIn([
      'GENERAL',
      'MAINTENANCE',
      'EMERGENCY',
      'EVENT',
      'general',
      'maintenance',
      'emergency',
      'event',
      'General',
      'Maintenance',
      'Emergency',
      'Event',
    ]),
  body('priority')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW', 'high', 'medium', 'low', 'High', 'Medium', 'Low']),
  body('audience')
    .notEmpty()
    .withMessage('Audience is required')
    .isIn([
      'ALL',
      'OWNERS',
      'TENANTS',
      'SECURITY',
      'RESIDENTS',
      'all',
      'owners',
      'tenants',
      'security',
      'residents',
      'All',
      'Owners',
      'Tenants',
      'Security',
      'Residents',
    ]),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601(),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601(),
  handleValidationErrors,
];

const validateUpdateNotice = [
  body('title').optional().notEmpty().isLength({ max: 200 }),
  body('priority')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW', 'high', 'medium', 'low', 'High', 'Medium', 'Low']),
  body('audience')
    .optional()
    .isIn([
      'ALL',
      'OWNERS',
      'TENANTS',
      'SECURITY',
      'RESIDENTS',
      'all',
      'owners',
      'tenants',
      'security',
      'residents',
      'All',
      'Owners',
      'Tenants',
      'Security',
      'Residents',
    ]),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  handleValidationErrors,
];

const validateId = [param('id').isInt().withMessage('Invalid notice ID'), handleValidationErrors];

// Routes
router.post('/', authenticate, authorize('SOCIETY_ADMIN'), validateCreateNotice, createNotice);

router.get('/', authenticate, getNotices);

router.get('/:id', authenticate, validateId, getNoticeById);

router.post('/:id/read', authenticate, validateId, markNoticeRead);

router.put(
  '/:id',
  authenticate,
  authorize('SOCIETY_ADMIN'),
  validateId,
  validateUpdateNotice,
  updateNotice
);

router.delete('/:id', authenticate, authorize('SOCIETY_ADMIN'), validateId, deactivateNotice);

export default router;
