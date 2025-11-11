import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { registerToken, sendToRole, sendToUser, testNotification } from '../controllers/notification.controller';

const router = Router();

// Any authenticated user can register their token
router.post('/register', verifyToken, registerToken);

// Any authenticated user can test their own notifications
router.post('/test', verifyToken, testNotification);

// Only admin can broadcast notifications to roles
router.post('/send', verifyToken, requireAdmin, sendToRole);

// Only admin can send to specific users
router.post('/send-user', verifyToken, requireAdmin, sendToUser);

export default router;


