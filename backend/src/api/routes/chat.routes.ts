import express from 'express';
import {
  sendMessage,
  getChatHistory,
  deleteMessage,
  clearRoomMessages,
  getRoomStats,
} from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { chatLimiter } from '../../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send message (with rate limiting)
router.post('/send', chatLimiter, sendMessage);

// Get chat history
router.get('/history', getChatHistory);

// Delete message
router.delete('/delete/:messageId', deleteMessage);

// Clear room messages (admin only)
router.delete('/clear/:routeNumber', clearRoomMessages);

// Get room statistics (admin only)
router.get('/stats/:routeNumber', getRoomStats);

export default router;
