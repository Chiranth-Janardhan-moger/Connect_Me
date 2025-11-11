"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomStats = exports.clearRoomMessages = exports.deleteMessage = exports.getChatHistory = exports.sendMessage = void 0;
const chat_service_1 = __importDefault(require("../services/chat.service"));
/**
 * Send message (save to database)
 */
const sendMessage = async (req, res) => {
    try {
        const { routeNumber, encryptedContent, timestamp } = req.body;
        const user = req.user;
        if (!routeNumber || !encryptedContent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Validate message length (encrypted content should be reasonable)
        if (encryptedContent.length > 10000) {
            return res.status(400).json({ error: 'Message too long' });
        }
        const message = await chat_service_1.default.saveMessage({
            roomId: routeNumber.toString(),
            senderId: user.id,
            senderName: user.name,
            senderRole: user.role,
            encryptedContent,
        });
        res.json({
            success: true,
            message: {
                id: message._id,
                timestamp: message.timestamp,
            },
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
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
        if (!messageId) {
            return res.status(400).json({ error: 'Message ID required' });
        }
        const deleted = await chat_service_1.default.deleteMessage(messageId, user.id);
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
