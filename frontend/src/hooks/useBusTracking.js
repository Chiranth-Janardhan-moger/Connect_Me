// hooks/useBusTracking.js
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { AnimatedRegion } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentAPI } from '../config/api';
import {
  joinBusRoom,
  listenToLocationUpdates,
  listenToBusReached,
  listenToTripEnded,
  disconnectSocket,
} from '../config/socket';

export const useBusTracking = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [tripStatus, setTripStatus] = useState('NOT_STARTED');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const busAnimatedCoord = useRef(null);
  const lastBusUpdateAtRef = useRef(0);
  const stalenessTimerRef = useRef(null);
  const isJoiningRef = useRef(false);
  const statusCallInFlightRef = useRef(false);
  const lastStatusCallAtRef = useRef(0);

  const checkTripStatus = async () => {
    try {
      const now = Date.now();
      if (statusCallInFlightRef.current) return null; // prevent overlap
      if (now - lastStatusCallAtRef.current < 5000) return null; // throttle 5s
      statusCallInFlightRef.current = true;
      lastStatusCallAtRef.current = now;
      console.log('Checking trip status...');
      setError(null);

      const response = await studentAPI.getLiveLocation();

      if (response.ok && response.data) {
        // Backend returns { locationAvailable, location: { latitude, longitude } }
        const { locationAvailable, location, status } = response.data;
        if (status === 'ON_ROUTE' && locationAvailable && location) {
          setTripStatus('ON_ROUTE');

          // Support payloads with latitude/longitude or lat/lng, and string numbers
          const latVal = location.latitude ?? location.lat;
          const lngVal = location.longitude ?? location.lng;
          const newLocation = {
            latitude: typeof latVal === 'string' ? parseFloat(latVal) : latVal,
            longitude: typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal,
          };

          // Validate coordinates
          if (isNaN(newLocation.latitude) || isNaN(newLocation.longitude)) {
            console.warn('Invalid bus location coordinates');
            setTripStatus('NOT_STARTED');
            return null;
          }

          setBusLocation(newLocation);
          lastBusUpdateAtRef.current = Date.now();

          if (!busAnimatedCoord.current) {
            busAnimatedCoord.current = new AnimatedRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          } else {
            busAnimatedCoord.current.setValue(newLocation);
          }

          try {
            await setupWebSocket();
          } catch (socketError) {
            console.warn('WebSocket setup failed:', socketError);
            // Continue without WebSocket
          }
          return newLocation;
        }
        // If no live location yet but trip is ON_ROUTE
        if (status === 'ON_ROUTE' && !locationAvailable) {
          setTripStatus('ON_ROUTE');
          // Clear stale location if bus hasn't sent location yet
          setBusLocation(null);
          try {
            await setupWebSocket();
          } catch (socketError) {
            console.warn('WebSocket setup failed:', socketError);
            // Continue without WebSocket
          }
          return null;
        }
        // Trip not started - clear location and disconnect socket
        setTripStatus('NOT_STARTED');
        setBusLocation(null);
        disconnect(); // Disconnect socket to prevent receiving stale updates
        return null;
      } else if (response.status === 404) {
        setTripStatus('NOT_STARTED');
        setBusLocation(null);
        disconnect(); // Disconnect socket
        return null;
      } else {
        setTripStatus('NOT_STARTED');
        setBusLocation(null);
        disconnect(); // Disconnect socket
        console.warn('Unable to fetch bus location:', response.data?.message);
        return null;
      }
    } catch (err) {
      console.error('Check trip error:', err);
      setTripStatus('NOT_STARTED');
      setBusLocation(null); // Clear any stale location data
      disconnect(); // Disconnect socket to prevent stale data
      console.warn('Trip status check failed, continuing without bus location');
      return null;
    } finally {
      statusCallInFlightRef.current = false;
    }
  };

  const setupWebSocket = async () => {
    try {
      if (isConnected || isJoiningRef.current) return;
      isJoiningRef.current = true;

      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        console.warn('User not found for WebSocket setup');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.routeNumber || !user._id) {
        console.warn('Invalid user data for WebSocket setup');
        return;
      }

      joinBusRoom(user.routeNumber, user._id);
      setIsConnected(true);

      listenToLocationUpdates((data) => {
        try {
          const latVal = data?.latitude ?? data?.lat;
          const lngVal = data?.longitude ?? data?.lng;
          if (latVal == null || lngVal == null) {
            console.warn('Invalid location data received');
            return;
          }

          const newLocation = {
            latitude: typeof latVal === 'string' ? parseFloat(latVal) : latVal,
            longitude: typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal,
          };

          // Validate coordinates
          if (isNaN(newLocation.latitude) || isNaN(newLocation.longitude)) {
            console.warn('Invalid coordinate values in location update');
            return;
          }

          // If we receive location via socket, trip must be ON_ROUTE
          setTripStatus('ON_ROUTE');
          setBusLocation(newLocation);
          if (__DEV__) {
            try { console.log('💡 Bus update via socket:', newLocation); } catch (_) {}
          }
          lastBusUpdateAtRef.current = Date.now();

          if (!busAnimatedCoord.current) {
            busAnimatedCoord.current = new AnimatedRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          } else {
            busAnimatedCoord.current.timing({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              duration: 1000,
              useNativeDriver: false,
            }).start();
          }
        } catch (updateError) {
          console.error('Error processing location update:', updateError);
        }
      });

      listenToBusReached(() => {
        try {
          Alert.alert('Trip Completed', 'The bus has reached!', [
            { text: 'OK', onPress: () => {
              setTripStatus('REACHED');
              disconnect();
            }}
          ]);
        } catch (alertError) {
          console.error('Error showing bus reached alert:', alertError);
          // Still update status even if alert fails
          setTripStatus('REACHED');
          disconnect();
        }
      });

      // Listen for trip-ended event from driver
      listenToTripEnded(() => {
        try {
          console.log('🛑 Trip ended notification received from driver');
          setTripStatus('NOT_STARTED');
          setBusLocation(null);
          disconnect();
        } catch (tripEndError) {
          console.error('Error handling trip-ended event:', tripEndError);
          // Still update status even if error occurs
          setTripStatus('NOT_STARTED');
          setBusLocation(null);
        }
      });
    } catch (err) {
      console.error('WebSocket error:', err);
      console.warn('WebSocket setup failed, continuing without real-time updates');
    } finally {
      isJoiningRef.current = false;
    }
  };

  const disconnect = () => {
    if (isConnected) {
      disconnectSocket();
      setIsConnected(false);
    }
  };

  // Staleness watchdog: hide bus if no updates for 45s
  useEffect(() => {
    if (stalenessTimerRef.current) {
      clearInterval(stalenessTimerRef.current);
      stalenessTimerRef.current = null;
    }
    stalenessTimerRef.current = setInterval(() => {
      const last = lastBusUpdateAtRef.current;
      if (!last) return;
      const elapsed = Date.now() - last;
      // Only hide marker if location is stale AND socket is disconnected
      // If socket is still connected, driver might be at a stop (legitimate pause)
      if (elapsed > 45000 && !isConnected) {
        console.warn('⚠️ Bus location stale and socket disconnected, hiding marker');
        setTripStatus('NOT_STARTED');
        setBusLocation(null);
        try { disconnect(); } catch (_) {}
        lastBusUpdateAtRef.current = 0;
      }
    }, 10000);
    return () => {
      if (stalenessTimerRef.current) clearInterval(stalenessTimerRef.current);
      stalenessTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, []);

  return {
    busLocation,
    busAnimatedCoord, // return ref; consumer should use .current
    tripStatus,
    isConnected,
    error,
    checkTripStatus,
    disconnect,
  };
};