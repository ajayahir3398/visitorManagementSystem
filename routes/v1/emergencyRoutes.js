import express from 'express';
import * as emergencyController from '../../controllers/v1/emergencyController.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All emergency routes require authentication
router.use(authenticate);

// Raise Emergency (Residents, Security and Society Admin can raise)
router.post('/', authorize('RESIDENT', 'SECURITY', 'SOCIETY_ADMIN'), emergencyController.raiseEmergency);

// Get Emergencies (List view with filters)
router.get('/', authorize('RESIDENT', 'SECURITY', 'SOCIETY_ADMIN'), emergencyController.getEmergencies);

// Get Emergency Timeline/Detail
router.get('/:id', authorize('RESIDENT', 'SECURITY', 'SOCIETY_ADMIN'), emergencyController.getEmergencyTimeline);

// Acknowledge Emergency (Security and Admin can acknowledge)
router.post('/:id/acknowledge', authorize('SECURITY', 'SOCIETY_ADMIN'), emergencyController.acknowledgeEmergency);

// Add Response Action (Security and Admin can respond)
router.post('/:id/respond', authorize('SECURITY', 'SOCIETY_ADMIN'), emergencyController.addEmergencyResponse);

// Resolve Emergency (Only Society Admin can formally resolve/close)
router.post('/:id/resolve', authorize('SOCIETY_ADMIN'), emergencyController.resolveEmergency);

export default router;
