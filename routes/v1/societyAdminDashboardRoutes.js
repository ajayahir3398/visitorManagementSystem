import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getOverview,
  getMaintenance,
  getVisitors,
  getEmergencies,
  getNotices,
  getActivity,
} from '../../controllers/v1/societyAdminDashboardController.js';

const router = express.Router();

// All routes require SOCIETY_ADMIN authentication
router.use(authenticate, authorize('SOCIETY_ADMIN'));

router.get('/overview', getOverview);
router.get('/maintenance', getMaintenance);
router.get('/visitors', getVisitors);
router.get('/emergencies', getEmergencies);
router.get('/notices', getNotices);
router.get('/activity', getActivity);

export default router;
