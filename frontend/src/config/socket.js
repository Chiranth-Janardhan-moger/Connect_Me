import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
let currentBase = SOCKET_URL;
let triedFlippedProtocol = false;
let currentLocationUpdateHandler = null;
let currentBusReachedHandler = null;
let currentTripEndedHandler = null;

const isIpHost = (host) => /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

const buildSocket = (base) => {
  return io(base, {
        transports: ['websocket', 'polling'], // Add polling as fallback
        autoConnect: false,
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 5, // Reduced from 10
        reconnectionDelay: 2000, // Increased from 1000
        reconnectionDelayMax: 10000,
        timeout: 15000, // Increased from 10000
        withCredentials: false,
        forceNew: true,
  });
};

export const initSocket = () => {
  if (socket) return socket;
  try {
    currentBase = SOCKET_URL;
    triedFlippedProtocol = false;
    socket = buildSocket(currentBase);

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id, 'base:', currentBase);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      // Only log detailed error if we haven't tried protocol flip yet
      if (!triedFlippedProtocol) {
        console.warn('⚠️ Socket connection failed:', error.message);
      }
      
      // If base is an IP and we haven't tried flipping protocol yet, try flipping http<->https
      try {
        const urlObj = new URL(currentBase);
        if (isIpHost(urlObj.hostname) && !triedFlippedProtocol) {
          triedFlippedProtocol = true;
          const flipped = new URL(currentBase);
          flipped.protocol = urlObj.protocol === 'https:' ? 'http:' : 'https:';
          const flippedOrigin = flipped.origin;
          if (flippedOrigin !== urlObj.origin) {
            console.log('♻️ Retrying socket with alternate protocol:', flippedOrigin);
            try { socket.off(); } catch (_) {}
            try { socket.disconnect(); } catch (_) {}
            socket = buildSocket(flippedOrigin);
            currentBase = flippedOrigin;
            // reattach basic listeners
            initSocket();
          }
        } else if (triedFlippedProtocol) {
          // After trying both protocols, log a helpful error
          console.error('❌ Socket connection failed on both HTTP and HTTPS. Check if backend is running at:', currentBase);
        }
      } catch (_) {}
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
    });
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const connectDriverSocket = () => {
  try {
    const socket = getSocket();
    if (socket && !socket.connected) {
      socket.connect();
      console.log('🔌 Driver socket connecting...');
    }
  } catch (error) {
    console.error('Failed to connect driver socket:', error);
  }
};

export const disconnectSocket = () => {
  try {
    if (socket) {
      try {
        // Clean up all event listeners
        if (currentLocationUpdateHandler) {
          socket.off('student:location-update', currentLocationUpdateHandler);
          currentLocationUpdateHandler = null;
        }
        if (currentBusReachedHandler) {
          socket.off('bus:reached', currentBusReachedHandler);
          currentBusReachedHandler = null;
        }
        if (currentTripEndedHandler) {
          socket.off('student:trip-ended', currentTripEndedHandler);
          currentTripEndedHandler = null;
        }
        // Leave all rooms before disconnecting
        socket.emit('disconnect');
      } catch (_) {}
      socket.disconnect();
      socket = null;
      console.log('🔌 Socket disconnected and cleared');
    }
  } catch (error) {
    console.error('Failed to disconnect socket:', error);
    socket = null; // Force clear even if disconnect fails
  }
};

export const resetSocket = () => {
  // For switching base URLs at runtime
  try {
    if (socket) {
      try {
        // Clean up all event listeners
        if (currentLocationUpdateHandler) {
          socket.off('student:location-update', currentLocationUpdateHandler);
          currentLocationUpdateHandler = null;
        }
        if (currentBusReachedHandler) {
          socket.off('bus:reached', currentBusReachedHandler);
          currentBusReachedHandler = null;
        }
        if (currentTripEndedHandler) {
          socket.off('student:trip-ended', currentTripEndedHandler);
          currentTripEndedHandler = null;
        }
      } catch (_) {}
      socket.disconnect();
    }
  } catch (_) {}
  socket = null;
  triedFlippedProtocol = false; // Reset retry flag for new connection
  console.log('♻️ Socket reset; next connect will use updated base URL');
};

// Student Socket Methods
// Updated to accept either busId or routeNumber (they're the same thing)
export const joinBusRoom = (routeNumber, studentId) => {
  try {
    const socket = getSocket();
    if (socket) {
      socket.connect();
      // Use routeNumber as busId since student's route = bus route
      socket.emit('student:join', { busId: routeNumber, studentId });
      console.log('📍 Joined bus room (Route):', routeNumber);
    } else {
      console.warn('Socket not available for joining bus room');
    }
  } catch (error) {
    console.error('Failed to join bus room:', error);
  }
};

export const listenToLocationUpdates = (callback) => {
  try {
    const socket = getSocket();
    if (socket) {
      // ONLY listen to room-specific student updates
      // Backend broadcasts 'student:location-update' to specific rooms
      // Do NOT listen to global 'driver:location-update' events
      const event = 'student:location-update';
      
      if (currentLocationUpdateHandler) {
        try { socket.off(event, currentLocationUpdateHandler); } catch (_) {}
      }
      currentLocationUpdateHandler = callback;
      socket.on(event, currentLocationUpdateHandler);
    } else {
      console.warn('Socket not available for location updates');
    }
  } catch (error) {
    console.error('Failed to listen to location updates:', error);
  }
};

export const listenToBusReached = (callback) => {
  try {
    const socket = getSocket();
    if (socket) {
      if (currentBusReachedHandler) {
        try { socket.off('bus:reached', currentBusReachedHandler); } catch (_) {}
      }
      currentBusReachedHandler = callback;
      socket.on('bus:reached', currentBusReachedHandler);
    } else {
      console.warn('Socket not available for bus reached events');
    }
  } catch (error) {
    console.error('Failed to listen to bus reached events:', error);
  }
};

export const listenToTripEnded = (callback) => {
  try {
    const socket = getSocket();
    if (socket) {
      if (currentTripEndedHandler) {
        try { socket.off('student:trip-ended', currentTripEndedHandler); } catch (_) {}
      }
      currentTripEndedHandler = callback;
      socket.on('student:trip-ended', currentTripEndedHandler);
      console.log('👂 Listening for trip-ended events');
    } else {
      console.warn('Socket not available for trip-ended events');
    }
  } catch (error) {
    console.error('Failed to listen to trip-ended events:', error);
  }
};

// Driver Socket Methods
// Updated to accept routeNumber as busId
export const emitDriverLocation = (routeNumber, latitude, longitude) => {
  try {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('driver:location-update', {
        busId: routeNumber, // Route number = Bus ID
        latitude,
        longitude,
      });
      console.log('📡 Location emitted for route:', routeNumber, latitude, longitude);
    } else {
      console.warn('Socket not connected, cannot emit location');
    }
  } catch (error) {
    console.error('Failed to emit driver location:', error);
  }
};