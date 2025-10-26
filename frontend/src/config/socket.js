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
export const joinBusRoom = (busId, studentId) => {
  const socket = getSocket();
  if (socket) {
    socket.connect();
    socket.emit('student:join', { busId, studentId });
    console.log('📍 Joined bus room:', busId);
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
export const emitDriverLocation = (busId, latitude, longitude) => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('driver:location-update', {
      busId,
      latitude,
      longitude,
    });
    console.log('📡 Location emitted:', latitude, longitude);
  }
};

