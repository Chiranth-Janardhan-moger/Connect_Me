import Message, { IMessage } from '../../models/message.model';

class ChatService {
  /**
   * Save message to database
   */
  async saveMessage(data: {
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: 'student' | 'driver' | 'admin';
    encryptedContent: string;
  }): Promise<IMessage> {
    try {
      // Messages expire after 3 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      const message = new Message({
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
    } catch (error) {
      console.error('Save message error:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a room
   */
  async getChatHistory(
    roomId: string,
    limit: number = 50,
    before?: Date
  ): Promise<any[]> {
    try {
      const query: any = {
        roomId,
      };

      if (before) {
        query.timestamp = { $lt: before };
      }

      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      console.log(`Retrieved ${messages.length} messages for room ${roomId}`);
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  /**
   * Delete message (soft delete for everyone)
   * Optionally validates the roomId against the provided routeNumber
   */
  async deleteMessage(messageId: string, userId: string, routeNumber?: string): Promise<boolean> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        return false;
      }

      // Optional room validation: ensure message belongs to the requested chat room
      if (routeNumber && message.roomId?.toString() !== routeNumber.toString()) {
        console.warn(`Attempt to delete message ${messageId} from mismatched room. Expected ${routeNumber}, got ${message.roomId}`);
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
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  /**
   * Delete all messages in a room (admin only)
   */
  async clearRoomMessages(roomId: string): Promise<number> {
    try {
      const result = await Message.updateMany(
        { roomId, deleted: false },
        { $set: { deleted: true } }
      );

      console.log(`Cleared ${result.modifiedCount} messages from room ${roomId}`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Clear room messages error:', error);
      throw error;
    }
  }

  /**
   * Get message statistics for a room
   */
  async getRoomStats(roomId: string) {
    try {
      const totalMessages = await Message.countDocuments({ roomId, deleted: false });
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentMessages = await Message.countDocuments({
        roomId,
        deleted: false,
        timestamp: { $gte: last24Hours },
      });

      return {
        totalMessages,
        recentMessages,
      };
    } catch (error) {
      console.error('Get room stats error:', error);
      throw error;
    }
  }
}

export default new ChatService();
