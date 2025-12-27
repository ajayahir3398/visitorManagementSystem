import express from 'express';
import authRoutes from './authRoutes.js';
import societyRoutes from './societyRoutes.js';
import userRoutes from './userRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import gateRoutes from './gateRoutes.js';
import visitorRoutes from './visitorRoutes.js';
import visitorLogRoutes from './visitorLogRoutes.js';
import unitRoutes from './unitRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import preApprovalRoutes from './preApprovalRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';

const router = express.Router();

// Mount all v1 routes
router.use('/auth', authRoutes);
router.use('/societies', societyRoutes);
router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/gates', gateRoutes);
router.use('/visitors', visitorRoutes);
router.use('/visitor-logs', visitorLogRoutes);
router.use('/units', unitRoutes);
router.use('/approvals', approvalRoutes);
router.use('/pre-approvals', preApprovalRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;

