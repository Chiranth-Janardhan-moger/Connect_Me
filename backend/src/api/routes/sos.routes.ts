import express from 'express';
import { sendSOS } from '../controllers/sos.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { sosLimiter } from '../../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send SOS alert (with rate limiting)
router.post('/send', sosLimiter, sendSOS);

export default router;
