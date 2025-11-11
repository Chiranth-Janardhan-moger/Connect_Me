import { Router } from 'express';
import { getAppVersion, updateAppVersion } from '../controllers/appVersion.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// Public route - anyone can check for updates
router.get('/version', getAppVersion);

// Admin only - update version
router.put('/version', verifyToken, requireAdmin, updateAppVersion);

export default router;
