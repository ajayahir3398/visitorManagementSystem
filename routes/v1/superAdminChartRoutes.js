import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getSocietyStatusChart,
  getMonthlyRevenueChart,
  getVisitorTrendChart,
  getPlanDistributionChart,
  getConversionChart,
  getTopCitiesChart,
} from '../../controllers/v1/superAdminChartController.js';

const router = express.Router();

// All routes require SUPER_ADMIN authentication
router.use(authenticate, authorize('SUPER_ADMIN'));

// Chart data endpoints
router.get('/society-status', getSocietyStatusChart);
router.get('/revenue', getMonthlyRevenueChart);
router.get('/visitors', getVisitorTrendChart);
router.get('/plan-distribution', getPlanDistributionChart);
router.get('/conversion', getConversionChart);
router.get('/top-cities', getTopCitiesChart);

export default router;
