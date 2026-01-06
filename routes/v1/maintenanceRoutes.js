import express from 'express';
import * as maintenanceController from '../../controllers/v1/maintenanceController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All maintenance routes require authentication
router.use(authenticate);

// Maintenance Plan Routes
router.post('/plans', authorize('SOCIETY_ADMIN'), maintenanceController.upsertMaintenancePlan);
router.get('/plans', authorize('SOCIETY_ADMIN', 'RESIDENT'), maintenanceController.getMaintenancePlans);

// Maintenance Bill Routes (Admin)
router.post('/bills/generate', authorize('SOCIETY_ADMIN'), maintenanceController.generateBulkBills);
router.post('/bills/single', authorize('SOCIETY_ADMIN'), maintenanceController.createSingleMaintenanceBill);
router.get('/bills/admin', authorize('SOCIETY_ADMIN'), maintenanceController.getAdminBills);

// Maintenance Bill Routes (Resident)
router.get('/bills/my', authorize('RESIDENT'), maintenanceController.getMyBills);
router.post('/bills/:id/pay', authorize('RESIDENT'), maintenanceController.payBill);

export default router;
