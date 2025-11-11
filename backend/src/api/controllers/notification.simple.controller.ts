// Simple Notification Controller - Socket-Only Broadcasting
import type { Request, Response } from 'express';
import { broadcastMaintenance } from '../services/notification.simple.service';

/**
 * Broadcast maintenance notification to ALL users
 * Admin only endpoint
 */
export const sendMaintenanceNotification = async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message || '').trim();
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: 'Message is required' 
      });
    }
    
    console.log(`📢 Admin ${req.user?.id} sending maintenance notification`);
    
    const result = await broadcastMaintenance(message);
    
    if (result.success) {
      return res.status(200).json({ 
        success: true,
        message: 'Maintenance notification broadcasted to all users',
        timestamp: result.timestamp
      });
    } else {
      return res.status(500).json({ 
        success: false,
        message: result.error || 'Failed to broadcast notification' 
      });
    }
  } catch (error) {
    console.error('❌ sendMaintenanceNotification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

export default { sendMaintenanceNotification };
