import express from 'express';
import authRoutes from './authRoutes.js';


const router = express.Router();
// Mount all v1 routes
router.use('/auth', authRoutes);

// Add more route modules here as they are created
// router.use('/visitors', visitorRoutes);
// router.use('/societies', societyRoutes);

export default router;

