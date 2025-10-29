import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { registerToken, sendToRole } from '../controllers/notification.controller';

const router = Router();

// Any authenticated user can register their token
router.post('/register', verifyToken, registerToken);

// Only admin can broadcast notifications
router.post('/send', verifyToken, requireAdmin, sendToRole);

export default router;


