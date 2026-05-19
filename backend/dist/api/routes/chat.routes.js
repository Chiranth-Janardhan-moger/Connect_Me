"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Send message (with rate limiting)
router.post('/send', rateLimiter_1.chatLimiter, chat_controller_1.sendMessage);
// Get chat history
router.get('/history', chat_controller_1.getChatHistory);
// Delete message (legacy path)
router.delete('/delete/:messageId', chat_controller_1.deleteMessage);
// Delete message (new path used by mobile app)
router.delete('/message/:messageId', chat_controller_1.deleteMessage);
// Clear room messages (admin only)
router.delete('/clear/:routeNumber', chat_controller_1.clearRoomMessages);
// Get room statistics (admin only)
router.get('/stats/:routeNumber', chat_controller_1.getRoomStats);
exports.default = router;
