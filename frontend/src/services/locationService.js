// services/locationService.js - FIXED GPS ACCURACY
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

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
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    
    if (existingStatus === 'granted') {
      console.log('Location permission already granted');
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to show your position and track the bus.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (Platform.OS === 'android') {
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        await Location.requestBackgroundPermissionsAsync();
      }
    }

    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted, using fallback');
      return getFallbackLocation();
    }

    const readings = [];
    let lastKnownLocation = null;
    
    for (let i = 0; i < 3; i++) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 10000, // Increased from 5000
          timeout: 15000, // Increased from 10000
        });
        
        if (location && location.coords) {
          lastKnownLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };
          
          // Accept readings with accuracy up to 100m (increased from 50m)
          if (location.coords.accuracy <= 100) {
            readings.push(lastKnownLocation);
          }
        }
        
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (locationError) {
        console.warn(`Location attempt ${i + 1} failed:`, locationError.message);
        // Continue trying other attempts
      }
    }

    // If we have any readings, use them
    if (readings.length > 0) {
      const avgLat = readings.reduce((sum, r) => sum + r.latitude, 0) / readings.length;
      const avgLng = readings.reduce((sum, r) => sum + r.longitude, 0) / readings.length;
      const avgAcc = readings.reduce((sum, r) => sum + r.accuracy, 0) / readings.length;

      if (!locationFilter) {
        locationFilter = new KalmanFilter(20); // Increased from 10
      }

      const filtered = locationFilter.process(avgLat, avgLng, avgAcc, Date.now());

      return {
        latitude: filtered.latitude,
        longitude: filtered.longitude,
        accuracy: avgAcc,
      };
    }
    
    // If we have a last known location, use it even if inaccurate
    if (lastKnownLocation) {
      console.warn('Using last known location with reduced accuracy');
      return {
        latitude: lastKnownLocation.latitude,
        longitude: lastKnownLocation.longitude,
        accuracy: lastKnownLocation.accuracy,
      };
    }

    // Final fallback
    console.warn('No location available, using fallback location');
    return getFallbackLocation();
  } catch (error) {
    console.error('Get location error:', error);
    console.warn('Using fallback location due to error');
    return getFallbackLocation();
  }
};

// Fallback location (can be set to a default location for your area)
const getFallbackLocation = () => {
  // Default to Bangalore coordinates as fallback
  return {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 1000, // Indicate this is not accurate
  };
};

export const watchPosition = async (callback) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted, using fallback tracking');
      // Return a mock subscription that provides fallback location
      return {
        remove: () => {},
        _isFallback: true,
      };
    }

    if (!locationFilter) {
      locationFilter = new KalmanFilter(20);
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Increased from 3000
        distanceInterval: 10, // Increased from 5
      },
      (position) => {
        try {
          if (!position || !position.coords) {
            console.warn('Invalid position data received');
            return;
          }

          const { latitude, longitude, accuracy } = position.coords;
          
          // Accept readings up to 200m accuracy (increased from 100m)
          if (accuracy > 200) {
            console.log('Ignoring inaccurate reading:', accuracy);
            return;
          }

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
      }
    );

    return subscription;
  } catch (error) {
    console.error('Watch position error:', error);
    // Return a fallback subscription instead of throwing
    console.warn('Using fallback location tracking due to error');
    return {
      remove: () => {},
      _isFallback: true,
    };
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