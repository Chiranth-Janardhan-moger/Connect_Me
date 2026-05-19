// Native background location service for driver
import { Platform, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, connectDriverSocket, emitDriverLocation } from '../config/socket';

let backgroundWatchId = null;
let isBackgroundTrackingActive = false;

// Background location watcher
const startBackgroundLocationWatch = (routeNumber) => {
  if (backgroundWatchId !== null) {
    console.log('⚠️ Background watch already active');
    return;
  }

  console.log('🚀 Starting native background location watch for route:', routeNumber);
  
  backgroundWatchId = Geolocation.watchPosition(
    (position) => {
      try {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Filter out extremely inaccurate readings
        if (accuracy > 200) {
          console.log('[Background] Ignoring inaccurate reading:', Math.round(accuracy), 'm');
          return;
        }
        
        console.log('[Background] Location update:', latitude.toFixed(6), longitude.toFixed(6), 'Accuracy:', Math.round(accuracy), 'm');
        
        // Emit to backend
        const socket = getSocket();
        if (!socket || !socket.connected) {
          connectDriverSocket();
        }
        emitDriverLocation(routeNumber, latitude, longitude);
      } catch (error) {
        console.error('[Background] Error processing location:', error);
      }
    },
    (error) => {
      console.error('[Background] Location error:', error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 1000,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000, // Update every 5 seconds
      fastestInterval: 3000,
    }
  );
  
  isBackgroundTrackingActive = true;
  console.log('✅ Background location watch started with ID:', backgroundWatchId);
};

const stopBackgroundLocationWatch = () => {
  if (backgroundWatchId !== null) {
    Geolocation.clearWatch(backgroundWatchId);
    backgroundWatchId = null;
    isBackgroundTrackingActive = false;
    console.log('✅ Background location watch stopped');
  }
};

export const enableDriverBackgroundUpdates = async (routeNumber) => {
  try {
    console.log('📍 Enabling native background location updates for route:', routeNumber);
    
    await AsyncStorage.setItem('driver_trip_active', '1');
    await AsyncStorage.setItem('driver_route_number', String(routeNumber));

    // Start native background location watch
    if (!isBackgroundTrackingActive) {
      startBackgroundLocationWatch(routeNumber);
    }
    
    console.log('✅ Native background updates enabled');
  } catch (error) {
    console.error('❌ Failed to enable background updates:', error);
    // Swallow; foreground tracking still works
  }
};

export const disableDriverBackgroundUpdates = async () => {
  try {
    console.log('🛑 Disabling native background location updates');
    
    await AsyncStorage.removeItem('driver_trip_active');
    
    // Stop native background location watch
    stopBackgroundLocationWatch();
    
    console.log('✅ Native background updates disabled');
  } catch (error) {
    console.error('❌ Failed to disable background updates:', error);
  }
};


