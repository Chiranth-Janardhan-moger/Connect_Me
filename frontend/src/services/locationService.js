// services/locationService.js - NATIVE GPS ACCURACY
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import { showWarningAlert } from '../../app/components/CustomAlert';

// Kalman filter for smoothing GPS coordinates
class KalmanFilter {
  constructor(accuracy = 1) {
    this.variance = -1;
    this.minAccuracy = accuracy;
  }

  process(lat, lng, accuracy, timestamp) {
    if (accuracy < this.minAccuracy) accuracy = this.minAccuracy;
    if (this.variance < 0) {
      this.timestamp = timestamp;
      this.lat = lat;
      this.lng = lng;
      this.variance = accuracy * accuracy;
    } else {
      const timeInc = timestamp - this.timestamp;
      if (timeInc > 0) {
        this.variance += (timeInc * accuracy * accuracy) / 1000;
        this.timestamp = timestamp;
      }
      
      const k = this.variance / (this.variance + accuracy * accuracy);
      this.lat += k * (lat - this.lat);
      this.lng += k * (lng - this.lng);
      this.variance = (1 - k) * this.variance;
    }
    
    return { latitude: this.lat, longitude: this.lng };
  }
}

let locationFilter = null;

export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access Required',
          message: 'BMS Connect needs access to your location to track the bus in real-time.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Android location permission granted');
        return true;
      } else {
        console.log('❌ Android location permission denied');
        showWarningAlert(
          '📍 Location Permission Required',
          'This app needs location access to show your position and track the bus.\n\nPlease grant location permission to continue using the app.'
        );
        return false;
      }
    } else {
      // iOS - location permissions are handled differently
      return true;
    }
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        reject(new Error('Location permission denied'));
        return;
      }

      console.log('📍 Getting current location with native GPS...');
      console.log('⏳ Please wait 30-60 seconds for initial GPS lock...');
      
      // Use React Native's native Geolocation API
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS Location received:', position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6));
          console.log('📊 GPS Accuracy:', Math.round(position.coords.accuracy), 'm');
          
          const { latitude, longitude, accuracy } = position.coords;
          
          // Initialize Kalman filter for smoothing
          if (!locationFilter) {
            locationFilter = new KalmanFilter(5);
          }

          const filtered = locationFilter.process(
            latitude,
            longitude,
            accuracy,
            Date.now()
          );

          const result = {
            latitude: filtered.latitude,
            longitude: filtered.longitude,
            accuracy: accuracy,
          };
          
          console.log('🎯 Returning filtered location:', result.latitude.toFixed(6), result.longitude.toFixed(6));
          resolve(result);
        },
        (error) => {
          console.error('❌ GPS Error:', error.message);
          
          // Provide helpful error message
          let helpfulError;
          if (error.code === 1) { // PERMISSION_DENIED
            helpfulError = new Error('Location permission denied. Please grant location access in app settings.');
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            helpfulError = new Error('GPS is unavailable. Please check your GPS settings and try again.');
          } else if (error.code === 3) { // TIMEOUT
            helpfulError = new Error('GPS is taking too long. Please go outdoors or near a window and try again.');
          } else {
            helpfulError = new Error('Unable to get GPS location. Please check your GPS settings and try again.');
          }
          
          reject(helpfulError);
        },
        {
          enableHighAccuracy: true,
          timeout: 60000, // 60 seconds for initial fix
          maximumAge: 10000, // Allow 10s old location
        }
      );
    } catch (error) {
      console.error('❌ Location service error:', error);
      reject(error);
    }
  });
};

// NO FALLBACK LOCATION - Always use real GPS data

export const watchPosition = async (callback) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    if (!locationFilter) {
      locationFilter = new KalmanFilter(20);
    }

    console.log('👀 Starting native location watcher with high accuracy...');
    
    const watchId = Geolocation.watchPosition(
      (position) => {
        try {
          if (!position || !position.coords) {
            console.warn('Invalid position data received');
            return;
          }

          const { latitude, longitude, accuracy } = position.coords;
          
          // Only filter extremely inaccurate readings (GPS error)
          if (accuracy > 200) {
            console.log('⚠️ Ignoring inaccurate reading:', Math.round(accuracy), 'm');
            return;
          }
          
          console.log('📍 GPS Update - Accuracy:', Math.round(accuracy), 'm', 'Lat:', latitude.toFixed(5), 'Lng:', longitude.toFixed(5));

          const filtered = locationFilter.process(
            latitude,
            longitude,
            accuracy,
            position.timestamp
          );

          callback({
            ...position,
            coords: {
              ...position.coords,
              latitude: filtered.latitude,
              longitude: filtered.longitude,
            },
          });
        } catch (callbackError) {
          console.error('Error in location callback:', callbackError);
        }
      },
      (error) => {
        console.error('❌ Watch position error:', error.message);
        // Don't throw - just log and continue
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        distanceFilter: 0, // Update on any movement
        interval: 1000, // Update every 1 second
      }
    );

    // Return subscription-like object
    return {
      remove: () => {
        if (watchId !== null) {
          Geolocation.clearWatch(watchId);
          console.log('🛑 Location watcher stopped');
        }
      },
    };
  } catch (error) {
    console.error('❌ Watch position error:', error);
    throw error;
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
};

export const isStationary = (locations, threshold = 20) => {
  if (locations.length < 2) return false;

  const distances = [];
  for (let i = 1; i < locations.length; i++) {
    const dist = calculateDistance(
      locations[i - 1].latitude,
      locations[i - 1].longitude,
      locations[i].latitude,
      locations[i].longitude
    );
    distances.push(dist);
  }

  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  return avgDistance < threshold;
};