// hooks/useLocation.js - NATIVE GPS ACCURACY
import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  getCurrentLocation, 
  watchPosition, 
  calculateDistance,
  isStationary 
} from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const animatedCoord = useRef(null);
  const locationSubscription = useRef(null);
  const lastUpdateTime = useRef(Date.now());
  const recentLocations = useRef([]);

  const initLocation = async () => {
    try {
      setError(null);
      console.log('🛰️ Initializing GPS with high accuracy...');
      
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        throw new Error('No location data received');
      }

      console.log('✅ Initial GPS lock - Accuracy:', Math.round(currentLocation.accuracy), 'meters');
      setLocation(currentLocation);

      animatedCoord.current = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      recentLocations.current = [currentLocation];
      return currentLocation;
    } catch (err) {
      console.error('❌ GPS initialization failed:', err.message);
      
      // Set error state for UI to display
      setError(err.message);
      
      // NO FALLBACK LOCATION - Let UI handle the error gracefully
      console.log('📍 GPS not available - UI will show error state');
      return null;
    }
  };

  const startTracking = async () => {
    if (isTracking) return;

    try {
      // Start tracking directly - native API will handle GPS checks
      console.log('🚀 Starting native GPS tracking...');

      console.log('Starting location tracking...');
      setIsTracking(true);

      const subscription = await watchPosition((position) => {
        try {
          if (!position || !position.coords) {
            console.warn('Invalid position data in tracking');
            return;
          }

          const { latitude, longitude, accuracy } = position.coords;

          // Only filter extremely inaccurate readings (GPS error)
          if (accuracy > 200) {
            console.log('⚠️ Ignoring inaccurate reading:', Math.round(accuracy), 'm');
            return;
          }

          const newLocation = { latitude, longitude, accuracy };
          
          // Update location EVERY TIME for smooth, fluid movement
          setLocation(newLocation);
          
          console.log('📍 GPS Update:', latitude.toFixed(6), longitude.toFixed(6), '| Acc:', Math.round(accuracy), 'm');
          console.log('✅ Location state updated in hook');

          if (!animatedCoord.current) {
            animatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
          } else {
            animatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
          }
        } catch (callbackError) {
          console.error('Error in tracking callback:', callbackError);
        }
      });

      locationSubscription.current = subscription;
    } catch (err) {
      console.error('Start tracking error:', err);
      setIsTracking(false);
      setError(err.message);
      
      // NO FALLBACK - Let UI handle the error
      console.warn('Location tracking failed, UI will show error state');
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      setIsTracking(false);
      recentLocations.current = [];
    }
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  const ensureAnimatedFromLocation = (loc) => {
    if (!loc) return;
    if (!animatedCoord.current) {
      animatedCoord.current = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
    }
  };

  // Debug: Log state changes
  console.log('🔄 useLocation state update:');
  console.log('  - location:', location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'null');
  console.log('  - error:', error);
  console.log('  - isTracking:', isTracking);

  return {
    location,
    animatedCoord, // return ref so consumers can read .current reactively when needed
    error,
    isTracking,
    initLocation,
    startTracking,
    stopTracking,
    ensureAnimatedFromLocation,
  };
};