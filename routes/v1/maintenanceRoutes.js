import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
    payMaintenance,
    getUpcomingMaintenance,
    getMyBills,
    createCustomBill
} from '../../controllers/v1/maintenanceController.js';

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
const validatePayMaintenance = [
    body('tempBillId')
        .notEmpty().withMessage('tempBillId is required')
        .isInt().withMessage('tempBillId must be an integer'),
    body('paymentMode')
        .notEmpty().withMessage('paymentMode is required')
        .isIn(['ONLINE', 'UPI', 'CASH', 'CHEQUE']).withMessage('Invalid payment mode'),
    body('transactionId')
        .optional()
        .isString().trim(),
    handleValidationErrors,
];

const validateCreateCustomBill = [
    body('unitId')
        .notEmpty().withMessage('unitId is required')
        .isInt().withMessage('unitId must be an integer'),
    body('amount')
        .notEmpty().withMessage('amount is required')
        .isInt({ min: 1 }).withMessage('amount must be a positive integer'),
    body('description')
        .notEmpty().withMessage('description is required')
        .isString().trim(),
    body('dueDate')
        .notEmpty().withMessage('dueDate is required')
        .isISO8601().withMessage('dueDate must be a valid date'),
    handleValidationErrors,
];

// Routes
// Resident routes
router.get('/upcoming', authenticate, authorize('RESIDENT'), getUpcomingMaintenance);
router.post('/pay', authenticate, authorize('RESIDENT'), validatePayMaintenance, payMaintenance);
router.get('/my-bills', authenticate, authorize('RESIDENT'), getMyBills);

// Admin routes
router.post('/custom-bill', authenticate, authorize('SOCIETY_ADMIN'), validateCreateCustomBill, createCustomBill);

export default router;
