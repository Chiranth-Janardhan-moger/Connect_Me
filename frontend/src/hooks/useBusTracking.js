// hooks/useBusTracking.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { busAPI } from '../config/api';
import { calculateDistance } from '../services/locationService';
import { showSuccessAlert, showErrorAlert } from '../../app/components/CustomAlert';
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
      console.log('📡 API Response:', response);

      if (response.ok && response.data) {
        // Backend returns { locationAvailable, location: { latitude, longitude } }
        const { locationAvailable, location, status } = response.data;
        console.log('🚌 Trip status:', status, 'Location available:', locationAvailable, 'Location:', location);
        
        if (status === 'ON_ROUTE' && locationAvailable && location) {
          console.log('✅ Bus is ON_ROUTE with location');
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
            busAnimatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
          } else {
            busAnimatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
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
          console.log('⏳ Trip is ON_ROUTE but driver hasn\'t sent location yet');
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

      console.log('🔌 Joining bus room with:');
      console.log('   - Route Number:', user.routeNumber);
      console.log('   - Student ID:', user._id);
      console.log('   - User data:', JSON.stringify(user));
      
      joinBusRoom(user.routeNumber, user._id);
      setIsConnected(true);
      console.log('✅ Socket connection established and room joined');

      listenToLocationUpdates((data) => {
        try {
          console.log('🚌 Received bus location update:', data);
          const latVal = data?.latitude ?? data?.lat;
          const lngVal = data?.longitude ?? data?.lng;
          if (latVal == null || lngVal == null) {
            console.warn('⚠️ Invalid location data received:', data);
            return;
          }

          const newLocation = {
            latitude: typeof latVal === 'string' ? parseFloat(latVal) : latVal,
            longitude: typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal,
          };

          // Validate coordinates
          if (isNaN(newLocation.latitude) || isNaN(newLocation.longitude)) {
            console.warn('⚠️ Invalid coordinate values in location update');
            return;
          }

          // If we receive location via socket, trip must be ON_ROUTE
          console.log('✅ Setting bus location:', newLocation);
          setTripStatus('ON_ROUTE');
          setBusLocation(newLocation);
          lastBusUpdateAtRef.current = Date.now();

          if (!busAnimatedCoord.current) {
            busAnimatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
          } else {
            busAnimatedCoord.current = {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            };
          }
        } catch (updateError) {
          console.error('Error processing location update:', updateError);
        }
      });

      listenToBusReached(() => {
        try {
          showSuccessAlert(
            '🚌 Trip Completed',
            'The bus has reached its destination! Thank you for using BMS Connect.'
          );
          setTripStatus('REACHED');
          disconnect();
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