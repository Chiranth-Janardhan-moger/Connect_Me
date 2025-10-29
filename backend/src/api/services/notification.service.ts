import { Expo } from 'expo-server-sdk';
import User, { UserRole } from '../../models/user.model';

const expo = new Expo();

async function saveUserToken(userId: string, token: string) {
  await User.findByIdAndUpdate(userId, { expoPushToken: token }, { new: true });
}

async function sendToRole(role: UserRole | 'driver' | 'student', payload: { title: string; body: string }) {
  const users = await User.find({ role, expoPushToken: { $exists: true, $ne: null } }).select('expoPushToken');
  const tokens = users.map((u: any) => u.expoPushToken).filter((t: string) => Expo.isExpoPushToken(t));
  if (tokens.length === 0) return { tickets: [], tokens: [] };

  const messages = tokens.map((to) => ({ to, sound: 'default', title: payload.title, body: payload.body }));
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any[] = [];
  for (const chunk of chunks) {
    try {
      const t = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...t);
    } catch (e) {
      console.error('Expo push chunk error', e);
    }
  }
  return { tickets, tokens };
}

export default { saveUserToken, sendToRole };


