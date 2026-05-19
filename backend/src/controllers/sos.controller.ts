import type { Request, Response } from 'express';
import { broadcastSOS } from '../services/sos.service';
import User from '../models/user.model';

export const sendSOS = async (req: Request, res: Response) => {
  try {
    const { type, location, routeNumber } = req.body;
    const user = req.user!;

    console.log('🚨 [SOS] Received SOS request:', { type, userId: user.id, routeNumber });

    if (!type || !location) {
      console.error('❌ [SOS] Missing required fields');
      return res.status(400).json({ message: 'Type and location required' });
    }

    // Fetch user details from database
    const userDoc = await User.findById(user.id).select('name role');
    if (!userDoc) {
      console.error('❌ [SOS] User not found:', user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const sosData = {
      userId: user.id,
      userName: userDoc.name,
      userRole: userDoc.role,
      type,
      location,
      routeNumber: routeNumber || user.routeNumber,
      timestamp: new Date().toISOString(),
    };

    console.log('📡 [SOS] Broadcasting SOS:', sosData);
    const result = await broadcastSOS(sosData);

    if (result.success) {
      console.log('✅ [SOS] SOS sent successfully');
      return res.status(200).json({ success: true, message: 'SOS sent' });
    } else {
      console.error('❌ [SOS] Failed to broadcast SOS');
      return res.status(500).json({ success: false, message: 'Failed to send SOS' });
    }
  } catch (error: any) {
    console.error('❌ [SOS] Error:', error);
    console.error('❌ [SOS] Error message:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal error',
      details: error.message 
    });
  }
};

export default { sendSOS };
