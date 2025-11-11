import { Request, Response } from 'express';
import { getIO } from '../../services/socket.service';

/**
 * Send SOS alert
 */
export const sendSOS = async (req: Request, res: Response) => {
  try {
    const { type, location, routeNumber, timestamp } = req.body;
    const user = (req as any).user;

    if (!type || !location || !routeNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sosData = {
      type,
      location,
      routeNumber,
      timestamp: timestamp || new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
    };

    // Broadcast SOS alert via Socket.IO to admin only
    const io = getIO();
    if (io) {
      // Send to admin room only
      io.to('admin').emit('sos:alert', sosData);
      
      console.log(`SOS alert sent: ${type} from ${user.name} on route ${routeNumber}`);
    }

    res.json({
      success: true,
      message: 'SOS alert sent successfully',
      data: sosData,
    });
  } catch (error) {
    console.error('Send SOS error:', error);
    res.status(500).json({ error: 'Failed to send SOS alert' });
  }
};
