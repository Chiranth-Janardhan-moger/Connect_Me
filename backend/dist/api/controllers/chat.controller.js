"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomStats = exports.clearRoomMessages = exports.deleteMessage = exports.getChatHistory = exports.sendMessage = void 0;
const chat_service_1 = __importDefault(require("../services/chat.service"));
const user_model_1 = __importDefault(require("../../models/user.model"));
/**
 * Send message (save to database)
 */
const sendMessage = async (req, res) => {
    try {
        const { routeNumber, encryptedContent, timestamp } = req.body;
        const user = req.user;
        console.log('📨 [CHAT] Received message request:', {
            routeNumber,
            encryptedContentLength: encryptedContent?.length,
            userId: user?.id,
            userName: user?.name,
            userRole: user?.role,
        });
        if (!routeNumber || !encryptedContent) {
            console.error('❌ [CHAT] Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Validate message length (encrypted content should be reasonable)
        if (encryptedContent.length > 10000) {
            console.error('❌ [CHAT] Message too long:', encryptedContent.length);
            return res.status(400).json({ error: 'Message too long' });
        }
        // Fetch user name from database since JWT doesn't include it
        const userDoc = await user_model_1.default.findById(user.id).select('name');
        if (!userDoc) {
            console.error('❌ [CHAT] User not found:', user.id);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('💾 [CHAT] Attempting to save message...');
        const message = await chat_service_1.default.saveMessage({
            roomId: routeNumber.toString(),
            senderId: user.id,
            senderName: userDoc.name,
            senderRole: user.role,
            encryptedContent,
        });
        console.log('✅ [CHAT] Message saved successfully:', message._id);
        res.json({
            success: true,
            message: {
                id: message._id,
                timestamp: message.timestamp,
            },
        });
    }
    catch (error) {
        console.error('❌ [CHAT] Send message error:', error);
        console.error('❌ [CHAT] Error name:', error.name);
        console.error('❌ [CHAT] Error message:', error.message);
        console.error('❌ [CHAT] Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
};
exports.sendMessage = sendMessage;
/**
 * Get chat history
 */
const getChatHistory = async (req, res) => {
    try {
        const { routeNumber, limit, before } = req.query;
        const user = req.user;
        if (!routeNumber) {
            return res.status(400).json({ error: 'Route number required' });
        }
        // Verify user has access to this route
        if (user.role !== 'admin' && user.routeNumber?.toString() !== routeNumber) {
            return res.status(403).json({ error: 'Access denied to this route' });
        }
        const messages = await chat_service_1.default.getChatHistory(routeNumber.toString(), limit ? parseInt(limit) : 50, before ? new Date(before) : undefined);
        res.json({
            success: true,
            messages,
        });
    }
    catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to retrieve messages' });
    }
};
exports.getChatHistory = getChatHistory;
/**
 * Delete message
 */
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const user = req.user;
        const { routeNumber, forEveryone } = req.body || {};
        if (!messageId) {
            return res.status(400).json({ error: 'Message ID required' });
        }
        const deleted = await chat_service_1.default.deleteMessage(messageId, user.id, routeNumber);
        if (!deleted) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete message error:', error);
        if (error.message === 'Unauthorized to delete this message') {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete message' });
    }
};
exports.deleteMessage = deleteMessage;
/**
 * Clear room messages (admin only)
 */
const clearRoomMessages = async (req, res) => {
    try {
        const { routeNumber } = req.params;
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const count = await chat_service_1.default.clearRoomMessages(routeNumber);
        res.json({
            success: true,
            deletedCount: count,
        });
    }
    catch (error) {
        console.error('Clear room messages error:', error);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
};
exports.clearRoomMessages = clearRoomMessages;
/**
 * Get room statistics (admin only)
 */
const getRoomStats = async (req, res) => {
    try {
        const { routeNumber } = req.params;
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const stats = await chat_service_1.default.getRoomStats(routeNumber);
        res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        console.error('Get room stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve stats' });
    }
};
exports.getRoomStats = getRoomStats;
