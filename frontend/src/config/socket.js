import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
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
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
    console.log('🔌 Driver socket connecting...');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected and cleared');
  }
};

// Student Socket Methods
// Updated to accept either busId or routeNumber (they're the same thing)
export const joinBusRoom = (routeNumber, studentId) => {
  const socket = getSocket();
  if (socket) {
    socket.connect();
    // Use routeNumber as busId since student's route = bus route
    socket.emit('student:join', { busId: routeNumber, studentId });
    console.log('📍 Joined bus room (Route):', routeNumber);
  }
};

export const listenToLocationUpdates = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('student:location-update', callback);
  }
};

export const listenToBusReached = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('bus:reached', callback);
  }
};

// Driver Socket Methods
// Updated to accept routeNumber as busId
export const emitDriverLocation = (routeNumber, latitude, longitude) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('driver:location-update', {
      busId: routeNumber, // Route number = Bus ID
      latitude,
      longitude,
    });
    console.log('📡 Location emitted for route:', routeNumber, latitude, longitude);
  }
};