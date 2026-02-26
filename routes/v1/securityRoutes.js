import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { getSecurityDashboard } from '../../controllers/v1/securityController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/security/dashboard
 * @desc    Get security dashboard data
 * @access  SECURITY only
 */
router.get('/dashboard', authenticate, authorize('SECURITY'), getSecurityDashboard);

export default router;
