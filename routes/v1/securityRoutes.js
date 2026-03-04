import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  getDashboardOverview,
  getPendingApprovals,
  getInsideVisitors,
  getRecentActivity,
  getDashboardEmergency,
  verifyGuestCode,
  visitorEntry,
  visitorExit,
  raiseEmergency,
} from '../../controllers/v1/securityController.js';

const router = express.Router();

// All routes require authentication and SECURITY role
router.use(authenticate, authorize('SECURITY'));

/**
 * @route   GET /api/v1/security/dashboard/overview
 * @desc    Get dashboard summary statistics
 */
router.get('/dashboard/overview', getDashboardOverview);

/**
 * @route   GET /api/v1/security/dashboard/pending-approvals
 * @desc    Get list of visitors waiting for approval
 */
router.get('/dashboard/pending-approvals', getPendingApprovals);

/**
 * @route   GET /api/v1/security/dashboard/inside-visitors
 * @desc    Get list of visitors currently inside
 */
router.get('/dashboard/inside-visitors', getInsideVisitors);

/**
 * @route   GET /api/v1/security/dashboard/recent-activity
 * @desc    Get latest security activity logs
 */
router.get('/dashboard/recent-activity', getRecentActivity);

/**
 * @route   GET /api/v1/security/dashboard/emergency
 * @desc    Get active emergency status
 */
router.get('/dashboard/emergency', getDashboardEmergency);

/**
 * @route   POST /api/v1/security/verify-guest-code
 * @desc    Verify pre-approved guest access code
 */
router.post('/verify-guest-code', verifyGuestCode);

/**
 * @route   POST /api/v1/security/visitor-entry
 * @desc    Register a new visitor entry request
 */
router.post('/visitor-entry', visitorEntry);

/**
 * @route   POST /api/v1/security/visitor-exit
 * @desc    Mark a visitor as exited
 */
router.post('/visitor-exit', visitorExit);

/**
 * @route   POST /api/v1/security/emergency
 * @desc    Raise a new emergency alert
 */
router.post('/emergency', raiseEmergency);

export default router;
