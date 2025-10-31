// hooks/useLocation.js - IMPROVED ACCURACY
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AnimatedRegion } from 'react-native-maps';
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
      console.log('Initializing location...');
      
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        console.warn('No location returned, using fallback');
        const fallbackLocation = {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 1000,
        };
        setLocation(fallbackLocation);
        return fallbackLocation;
      }

      console.log('Initial accuracy:', currentLocation.accuracy, 'meters');
      setLocation(currentLocation);

      if (!animatedCoord.current) {
        animatedCoord.current = new AnimatedRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        animatedCoord.current.setValue({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }

      recentLocations.current = [currentLocation];
      return currentLocation;
    } catch (err) {
      console.error('Location init error:', err);
      setError(err.message);
      
      // Don't show alert for location errors, just use fallback
      console.warn('Using fallback location due to error');
      const fallbackLocation = {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 1000,
      };
      setLocation(fallbackLocation);
      return fallbackLocation;
    }
  };

  const startTracking = async () => {
    if (isTracking) return;

    try {
      console.log('Starting location tracking...');
      setIsTracking(true);

      const subscription = await watchPosition((position) => {
        try {
          if (!position || !position.coords) {
            console.warn('Invalid position data in tracking');
            return;
          }

          const now = Date.now();
          const timeDelta = now - lastUpdateTime.current;
          const { latitude, longitude, accuracy } = position.coords;

          if (__DEV__) {
            console.log('GPS - Accuracy:', Math.round(accuracy), 'm');
          }

          // More lenient conditions for indoor/less accurate GPS
          if (timeDelta < 2000 || accuracy > 200) return;

          const newLocation = { latitude, longitude, accuracy };

          if (location) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              newLocation.latitude,
              newLocation.longitude
            );

            recentLocations.current.push(newLocation);
            if (recentLocations.current.length > 5) {
              recentLocations.current.shift();
            }

            const stationary = isStationary(recentLocations.current, 25); // Increased from 15
            
            if (stationary && distance < 25) { // Increased from 15
              console.log('Filtering GPS drift');
              return;
            }

            if (distance < 15) return; // Increased from 8
            
            console.log('✅ Movement:', Math.round(distance), 'm');
          }

          lastUpdateTime.current = now;
          setLocation(newLocation);

          if (!animatedCoord.current) {
            animatedCoord.current = new AnimatedRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          } else {
            animatedCoord.current.timing({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              duration: 2000,
              useNativeDriver: false,
            }).start();
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
      
      // Don't show alert, just log the error and continue
      console.warn('Location tracking failed, continuing without live updates');
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
      animatedCoord.current = new AnimatedRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

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