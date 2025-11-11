"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_model_1 = __importDefault(require("../../models/message.model"));
class ChatService {
    /**
     * Save message to database
     */
    async saveMessage(data) {
        try {
            // Messages expire after 7 days
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            const message = new message_model_1.default({
                roomId: data.roomId,
                senderId: data.senderId,
                senderName: data.senderName,
                senderRole: data.senderRole,
                encryptedContent: data.encryptedContent,
                timestamp: new Date(),
                expiresAt,
                deleted: false,
            });
            await message.save();
            console.log(`Message saved for room ${data.roomId}`);
            return message;
        }
        catch (error) {
            console.error('Save message error:', error);
            throw error;
        }
    }
    /**
     * Get chat history for a room
     */
    async getChatHistory(roomId, limit = 50, before) {
        try {
            const query = {
                roomId,
                deleted: false,
            };
            if (before) {
                query.timestamp = { $lt: before };
            }
            const messages = await message_model_1.default.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
            console.log(`Retrieved ${messages.length} messages for room ${roomId}`);
            return messages.reverse(); // Return in chronological order
        }
        catch (error) {
            console.error('Get chat history error:', error);
            throw error;
        }
    }
    /**
     * Delete message (soft delete)
     */
    async deleteMessage(messageId, userId) {
        try {
            const message = await message_model_1.default.findById(messageId);
            if (!message) {
                return false;
            }
            // Only allow sender or admin to delete
            if (message.senderId.toString() !== userId && message.senderRole !== 'admin') {
                throw new Error('Unauthorized to delete this message');
            }
            message.deleted = true;
            await message.save();
            console.log(`Message ${messageId} deleted by user ${userId}`);
            return true;
        }
        catch (error) {
            console.error('Delete message error:', error);
            throw error;
        }
    }
    /**
     * Delete all messages in a room (admin only)
     */
    async clearRoomMessages(roomId) {
        try {
            const result = await message_model_1.default.updateMany({ roomId, deleted: false }, { $set: { deleted: true } });
            console.log(`Cleared ${result.modifiedCount} messages from room ${roomId}`);
            return result.modifiedCount;
        }
        catch (error) {
            console.error('Clear room messages error:', error);
            throw error;
        }
    }
    /**
     * Get message statistics for a room
     */
    async getRoomStats(roomId) {
        try {
            const totalMessages = await message_model_1.default.countDocuments({ roomId, deleted: false });
            const last24Hours = new Date();
            last24Hours.setHours(last24Hours.getHours() - 24);
            const recentMessages = await message_model_1.default.countDocuments({
                roomId,
                deleted: false,
                timestamp: { $gte: last24Hours },
            });
            return {
                totalMessages,
                recentMessages,
            };
        }
        catch (error) {
            console.error('Get room stats error:', error);
            throw error;
        }
    }
}
exports.default = new ChatService();
