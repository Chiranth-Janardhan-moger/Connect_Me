import { Request, Response } from 'express';
import chatService from '../services/chat.service';
import User from '../../models/user.model';

/**
 * Send message (save to database)
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { routeNumber, encryptedContent, timestamp } = req.body;
    const user = (req as any).user;

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
    const userDoc = await User.findById(user.id).select('name');
    if (!userDoc) {
      console.error('❌ [CHAT] User not found:', user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('💾 [CHAT] Attempting to save message...');
    const message = await chatService.saveMessage({
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
  } catch (error: any) {
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

/**
 * Get chat history
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { routeNumber, limit, before } = req.query;
    const user = (req as any).user;

    if (!routeNumber) {
      return res.status(400).json({ error: 'Route number required' });
    }

    // Verify user has access to this route
    if (user.role !== 'admin' && user.routeNumber?.toString() !== routeNumber) {
      return res.status(403).json({ error: 'Access denied to this route' });
    }

    const messages = await chatService.getChatHistory(
      routeNumber.toString(),
      limit ? parseInt(limit as string) : 50,
      before ? new Date(before as string) : undefined
    );

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const user = (req as any).user;
    const { routeNumber, forEveryone } = req.body || {};

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    const deleted = await chatService.deleteMessage(messageId, user.id, routeNumber);

    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete message error:', error);
    if (error.message === 'Unauthorized to delete this message') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

/**
 * Clear room messages (admin only)
 */
export const clearRoomMessages = async (req: Request, res: Response) => {
  try {
    const { routeNumber } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const count = await chatService.clearRoomMessages(routeNumber);

    res.json({
      success: true,
      deletedCount: count,
    });
  } catch (error) {
    console.error('Clear room messages error:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
};

/**
 * Get room statistics (admin only)
 */
export const getRoomStats = async (req: Request, res: Response) => {
  try {
    const { routeNumber } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await chatService.getRoomStats(routeNumber);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get room stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
};
