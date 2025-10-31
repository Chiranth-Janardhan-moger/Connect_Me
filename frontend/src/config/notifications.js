import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    // Skip remote push registration when running in Expo Go (SDK 53 limitation)
    if (Constants?.appOwnership === 'expo') {
      console.warn('Skipping push registration: Use a Development Build (Expo Go does not support remote push in SDK 53).');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check and request permissions
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const ask = await Notifications.requestPermissionsAsync();
      status = ask.status;
    }
    if (status !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get Expo push token
    const proj = await Notifications.getExpoPushTokenAsync();
    const token = proj?.data;
    if (!token) return null;

    // Avoid re-registering if same token
    const prev = await AsyncStorage.getItem('EXPO_PUSH_TOKEN');
    if (prev !== token) {
      await AsyncStorage.setItem('EXPO_PUSH_TOKEN', token);
      // Send to backend (auth required)
      await notificationAPI.registerToken(token);
    }

    return token;
  } catch (e) {
    console.warn('Failed to register for push notifications', e?.message || e);
    return null;
  }
}

export function subscribeNotificationListeners(onReceive) {
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    try { onReceive?.(notification); } catch (_) {}
  });
  return () => {
    try { sub.remove(); } catch (_) {}
  };
}


