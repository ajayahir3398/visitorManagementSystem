import express from 'express';

const router = express.Router();

// API Versioning
// Mount version-specific routes
import v1Routes from './v1/index.js';
router.use('/v1', v1Routes);

import v2Routes from './v2/index.js';
router.use('/v2', v2Routes);

export default router;
