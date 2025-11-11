import type { Request, Response } from 'express';
import { broadcastSOS } from '../services/sos.service';

export const sendSOS = async (req: Request, res: Response) => {
  try {
    const { type, location, routeNumber } = req.body;

    if (!type || !location) {
      return res.status(400).json({ message: 'Type and location required' });
    }

    const sosData = {
      userId: req.user!.id,
      type,
      location,
      routeNumber,
      timestamp: new Date().toISOString(),
    };

    const result = await broadcastSOS(sosData);

    if (result.success) {
      return res.status(200).json({ success: true, message: 'SOS sent' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send SOS' });
    }
  } catch (error) {
    console.error('SOS error:', error);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};

export default { sendSOS };
