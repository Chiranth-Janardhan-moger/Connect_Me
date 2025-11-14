import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications using Expo Push Notifications
 * Works in both Expo Go and standalone APK builds
 * @param {Object} options - Configuration options
 * @param {boolean} options.skipBackendRegistration - Skip backend registration (useful for testing)
 * @param {number} options.retryAttempts - Number of retry attempts for backend registration (default: 3)
 * @returns {Promise<{success: boolean, token: string|null, error: string|null}>}
 */
export async function registerForPushNotificationsAsync(options = {}) {
  const { skipBackendRegistration = false, retryAttempts = 3 } = options;
  
  try {
    console.log('🔔 Starting push notification registration...');
    console.log('📱 Platform:', Platform.OS);
    console.log('📱 Device:', Device.isDevice ? 'Physical Device' : 'Simulator/Emulator');

    // Step 1: Check if running on physical device
    if (!Device.isDevice) {
      const message = 'Push notifications require a physical device. Simulators/emulators are not supported.';
      console.warn('⚠️', message);
      return { success: false, token: null, error: message };
    }

    // Step 2: Check existing permissions
    console.log('🔐 Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📊 Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    // Step 3: Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('📝 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📊 Permission request result:', finalStatus);
    }
    
    // Step 4: Handle permission denial
    if (finalStatus !== 'granted') {
      const message = 'Notification permission denied. Please enable notifications in device settings.';
      console.warn('❌', message);
      return { success: false, token: null, error: message };
    }

    console.log('✅ Notification permissions granted');

    // Step 5: Get Expo Push Token
    console.log('🎫 Fetching Expo Push Token...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('📋 EAS Project ID:', projectId || 'Not configured');
    
    let tokenData;
    try {
      // Try with projectId first, fallback to without if not configured
      if (projectId) {
        tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      } else {
        console.log('⚠️ No EAS projectId found, using fallback method');
        tokenData = await Notifications.getExpoPushTokenAsync();
      }
    } catch (tokenError) {
      console.error('❌ Failed to get Expo Push Token:', tokenError.message);
      // Try one more time without projectId as fallback
      try {
        console.log('🔄 Retrying without projectId...');
        tokenData = await Notifications.getExpoPushTokenAsync();
      } catch (fallbackError) {
        const message = `Failed to get Expo Push Token: ${fallbackError.message}`;
        console.error('❌', message);
        return { success: false, token: null, error: message };
      }
    }
    
    const token = tokenData.data;
    
    if (!token || typeof token !== 'string' || !token.startsWith('ExponentPushToken[')) {
      const message = 'Invalid Expo Push Token format received';
      console.error('❌', message, 'Token:', token);
      return { success: false, token: null, error: message };
    }

    console.log('✅ Expo Push Token obtained:', token.substring(0, 50) + '...');

    // Step 6: Save token to AsyncStorage
    const prevToken = await AsyncStorage.getItem('EXPO_PUSH_TOKEN');
    await AsyncStorage.setItem('EXPO_PUSH_TOKEN', token);
    
    if (prevToken && prevToken !== token) {
      console.log('🔄 Token changed from previous session');
    }
    
    // Step 7: Register with backend (with retry logic)
    if (!skipBackendRegistration) {
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        console.log('📤 Registering token with backend...');
        
        let registered = false;
        let lastError = null;
        
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            const response = await notificationAPI.registerToken(token);
            
            if (response.ok) {
              console.log('✅ Token registered with backend successfully');
              await AsyncStorage.setItem('EXPO_PUSH_TOKEN_REGISTERED', 'true');
              registered = true;
              break;
            } else {
              lastError = response.data?.message || 'Backend registration failed';
              console.warn(` Backend registration attempt ${attempt}/${retryAttempts} failed:`, lastError);
            }
          } catch (error) {
            lastError = error?.message || 'Network error';
            console.warn(` Backend registration attempt ${attempt}/${retryAttempts} error:`, lastError);
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < retryAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        if (!registered) {
          console.warn('⚠️ Failed to register token with backend after', retryAttempts, 'attempts');
          console.warn('💡 Token saved locally. Will retry on next app launch.');
          await AsyncStorage.setItem('EXPO_PUSH_TOKEN_REGISTERED', 'false');
        }
      } else {
        console.log('ℹ️ No auth token found. Token will be registered after login.');
        await AsyncStorage.setItem('EXPO_PUSH_TOKEN_REGISTERED', 'false');
      }
    }

    // Step 8: Set up notification channel for Android
    if (Platform.OS === 'android') {
      console.log('📱 Configuring Android notification channel...');
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('✅ Android notification channel configured');
      } catch (channelError) {
        console.warn('⚠️ Failed to configure Android channel:', channelError.message);
      }
    }

    console.log('🎉 Push notification registration completed successfully');
    return { success: true, token, error: null };
  } catch (error) {
    const message = error?.message || 'Unknown error during notification registration';
    console.error('❌ Push notification registration failed:', message);
    console.error('📋 Error details:', error);
    return { success: false, token: null, error: message };
  }
}

/**
 * Subscribe to notification listeners
 * @param {Function} onReceive - Callback when notification is received
 * @returns {Function} Unsubscribe function
 */
export function subscribeNotificationListeners(onReceive) {
  // Listen for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification received (foreground):', notification);
    try {
      onReceive?.(notification);
    } catch (error) {
      console.warn('Error in notification received callback:', error);
    }
  });

  // Listen for notification responses (user tapped notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('📬 Notification tapped:', response);
    try {
      onReceive?.(response.notification);
    } catch (error) {
      console.warn('Error in notification response callback:', error);
    }
  });

  // Return unsubscribe function
  return () => {
    try {
      receivedSubscription.remove();
      responseSubscription.remove();
      console.log('🔕 Notification listeners removed');
    } catch (error) {
      console.warn('Error removing notification listeners:', error);
    }
  };
}

/**
 * Show a local notification
 * @param {Object} options - Notification options
 */
export async function showLocalNotification({ title, body, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Connect Me',
        body: body || '',
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
    console.log('✅ Local notification shown');
  } catch (error) {
    console.warn('Failed to show local notification:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
  }
}

/**
 * Force re-register token with backend (useful for testing and troubleshooting)
 * @returns {Promise<{success: boolean, message: string, token?: string}>}
 */
export async function forceRegisterToken() {
  try {
    console.log('🔄 Starting force token registration...');
    
    const token = await AsyncStorage.getItem('EXPO_PUSH_TOKEN');
    const authToken = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      const message = 'No token found in storage. Please restart app to register.';
      console.warn('⚠️', message);
      return { success: false, message };
    }
    
    if (!authToken) {
      const message = 'Not logged in. Please log in first.';
      console.warn('⚠️', message);
      return { success: false, message };
    }
    
    console.log('📤 Sending token to backend:', token.substring(0, 50) + '...');
    const response = await notificationAPI.registerToken(token);
    
    if (response.ok) {
      await AsyncStorage.setItem('EXPO_PUSH_TOKEN_REGISTERED', 'true');
      console.log('✅ Token force-registered successfully');
      return { success: true, message: 'Token registered successfully', token };
    } else {
      const message = response.data?.message || 'Backend registration failed';
      console.error('❌ Force register failed:', message);
      return { success: false, message };
    }
  } catch (error) {
    const message = error?.message || 'Registration failed';
    console.error('❌ Force register error:', error);
    return { success: false, message };
  }
}

/**
 * Check notification registration status
 * @returns {Promise<{hasToken: boolean, isRegistered: boolean, token: string|null}>}
 */
export async function getNotificationStatus() {
  try {
    const token = await AsyncStorage.getItem('EXPO_PUSH_TOKEN');
    const isRegistered = (await AsyncStorage.getItem('EXPO_PUSH_TOKEN_REGISTERED')) === 'true';
    const authToken = await AsyncStorage.getItem('authToken');
    
    return {
      hasToken: !!token,
      isRegistered: isRegistered && !!authToken,
      token: token || null,
      isLoggedIn: !!authToken,
    };
  } catch (error) {
    console.error('Error checking notification status:', error);
    return { hasToken: false, isRegistered: false, token: null, isLoggedIn: false };
  }
}

export default {
  registerForPushNotificationsAsync,
  subscribeNotificationListeners,
  showLocalNotification,
  cancelAllNotifications,
  forceRegisterToken,
  getNotificationStatus,
};


