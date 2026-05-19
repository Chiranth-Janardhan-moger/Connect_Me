// SOS Emergency Service
import { apiCall } from '../config/api';
import { getSocket } from '../config/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { accelerometer } from 'react-native-sensors'; // Disabled for Expo managed workflow
import { SOS_CONFIG } from '../config/keys';

const ACCIDENT_THRESHOLD = SOS_CONFIG.ACCIDENT_THRESHOLD; // 3G force
const ACCIDENT_DURATION = SOS_CONFIG.ACCIDENT_DURATION; // milliseconds

class SOSService {
  constructor() {
    this.accidentDetectionActive = false;
    this.accelerometerSubscription = null;
  }

  /**
   * Send SOS alert
   */
  async sendSOS(data) {
    try {
      console.log('🚨 Sending SOS alert:', data);
      
      // Get user info from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) {
        console.error('❌ No user data found in AsyncStorage');
        return { success: false, error: 'User not logged in. Please log in and try again.' };
      }
      
      // Enrich data with user info
      const enrichedData = {
        ...data,
        userId: user._id || user.id,
        userName: user.name || user.username || 'Unknown',
        userRole: await AsyncStorage.getItem('userRole') || 'student',
      };
      
      console.log('📝 Enriched SOS data:', enrichedData);

      // Send via API
      const response = await apiCall('/api/sos/send', {
        method: 'POST',
        body: JSON.stringify(enrichedData),
      });
      
      console.log('📡 SOS API response:', { ok: response.ok, status: response.status });

      if (!response.ok) {
        const errorMsg = response.data?.message || response.data?.error || `Server error (${response.status})`;
        console.error('❌ SOS API failed:', errorMsg);
        return { success: false, error: errorMsg };
      }

      // Also broadcast via Socket.IO for real-time alerts
      try {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('sos:alert', enrichedData);
          console.log('✅ SOS broadcasted via Socket.IO');
        } else {
          console.warn('⚠️ Socket not connected, skipping real-time broadcast');
        }
      } catch (socketError) {
        console.warn('⚠️ Socket broadcast failed:', socketError.message);
        // Don't fail the entire SOS if socket fails
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ SOS send error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send SOS. Please try again or call emergency services.' 
      };
    }
  }

  /**
   * Start accident detection using accelerometer
   */
  startAccidentDetection(callback) {
    if (this.accidentDetectionActive) return;

    console.log('🔍 Starting accident detection...');
    this.accidentDetectionActive = true;

    this.accelerometerSubscription = accelerometer.subscribe(({ x, y, z }) => {
      // Calculate G-force magnitude
      const gForce = Math.sqrt(x * x + y * y + z * z) / 9.81;

      // Detect sudden deceleration (accident)
      if (gForce > ACCIDENT_THRESHOLD) {
        console.log(`⚠️ High G-force detected: ${gForce.toFixed(2)}G`);
        
        if (callback) {
          callback({
            type: 'accident',
            gForce: gForce,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  }

  /**
   * Stop accident detection
   */
  stopAccidentDetection() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.unsubscribe();
      this.accelerometerSubscription = null;
    }
    this.accidentDetectionActive = false;
    console.log('🛑 Accident detection stopped');
  }

  /**
   * Get SOS history
   */
  async getSOSHistory() {
    try {
      const response = await apiCall('/api/sos/history', {
        method: 'GET',
      });

      return { success: response.ok, data: response.data };
    } catch (error) {
      console.error('Get SOS history error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const sosService = new SOSService();
export default sosService;
