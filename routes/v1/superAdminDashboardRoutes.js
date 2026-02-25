import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getSummary,
  getRevenue,
  getSubscriptions,
  getNotifications,
} from '../../controllers/v1/superAdminDashboardController.js';

const router = express.Router();

// All routes require SUPER_ADMIN authentication
router.use(authenticate, authorize('SUPER_ADMIN'));

// Dashboard metric endpoints
router.get('/summary', getSummary);
router.get('/revenue', getRevenue);
router.get('/subscriptions', getSubscriptions);
router.get('/notifications', getNotifications);

export default router;

