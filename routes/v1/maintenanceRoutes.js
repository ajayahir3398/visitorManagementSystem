import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
    payMaintenance,
    getUpcomingMaintenance,
    getMyBills,
    createCustomBill,
    getAdminMaintenanceBills,
    adminMarkBillPaid,
    getSocietyBills
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

const validateAdminPay = [
    body('billType')
        .notEmpty().withMessage('billType is required')
        .isIn(['TEMP', 'FINAL']).withMessage('billType must be TEMP or FINAL'),
    body('billId')
        .notEmpty().withMessage('billId is required')
        .isInt().withMessage('billId must be an integer'),
    body('paymentMode')
        .notEmpty().withMessage('paymentMode is required')
        .isIn(['ONLINE', 'UPI', 'CASH', 'CHEQUE']).withMessage('Invalid payment mode'),
    handleValidationErrors,
];

// Routes
// Resident routes
router.post('/pay', authenticate, authorize('RESIDENT'), validatePayMaintenance, payMaintenance);
router.get('/my-bills', authenticate, authorize('RESIDENT'), getMyBills);
router.get('/upcoming', authenticate, authorize('RESIDENT'), getUpcomingMaintenance);

// Admin routes
router.post('/custom-bill', authenticate, authorize('SOCIETY_ADMIN'), validateCreateCustomBill, createCustomBill);
router.get('/bills/admin', authenticate, authorize('SOCIETY_ADMIN'), getAdminMaintenanceBills);
router.get('/society-bills', authenticate, authorize('SOCIETY_ADMIN'), getSocietyBills);
router.post('/admin/pay', authenticate, authorize('SOCIETY_ADMIN'), validateAdminPay, adminMarkBillPaid);

export default router;
