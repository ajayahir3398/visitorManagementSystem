import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getMaintenanceCollectionChart,
  getVisitorTrendChart,
  getEmergencyTypesChart,
  getMaintenanceStatusChart,
} from '../../controllers/v1/societyAdminChartController.js';

const router = express.Router();

// All routes require SOCIETY_ADMIN authentication
router.use(authenticate, authorize('SOCIETY_ADMIN'));

router.get('/maintenance-collection', getMaintenanceCollectionChart);
router.get('/visitor-trend', getVisitorTrendChart);
router.get('/emergency-types', getEmergencyTypesChart);
router.get('/maintenance-status', getMaintenanceStatusChart);

export default router;
