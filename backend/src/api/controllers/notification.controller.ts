import type { Request, Response } from 'express';
import notificationService from '../services/notification.service';

export const registerToken = async (req: Request, res: Response) => {
  try {
    const token = req.body?.token as string | undefined;
    if (!token) return res.status(400).json({ message: 'token is required' });
    await notificationService.saveUserToken(req.user!.id, token);
    return res.status(200).json({ message: 'Token registered' });
  } catch (e) {
    console.error('registerToken error', e);
    return res.status(500).json({ message: 'Failed to register token' });
  }
};

export const sendToRole = async (req: Request, res: Response) => {
  try {
    const role = String(req.body?.role || '').toLowerCase();
    const title = String(req.body?.title || '');
    const body = String(req.body?.body || '');
    if (!role || !title || !body) {
      return res.status(400).json({ message: 'role, title, and body are required' });
    }
    const result = await notificationService.sendToRole(role as any, { title, body });
    return res.status(200).json({ message: 'Sent', result });
  } catch (e) {
    console.error('sendToRole error', e);
    return res.status(500).json({ message: 'Failed to send notifications' });
  }
};

export default { registerToken, sendToRole };


