import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSOSService(socketIO: SocketIOServer) {
  io = socketIO;
}

export async function broadcastSOS(data: any) {
  if (!io) return { success: false, error: 'Socket not initialized' };

  try {
    // Broadcast to admin
    io.emit('sos:alert:admin', data);
    
    // Broadcast to drivers on same route
    if (data.routeNumber) {
      io.to(`driver:${data.routeNumber}`).emit('sos:alert:driver', data);
    }

    console.log(`🚨 SOS broadcasted: ${data.type} on route ${data.routeNumber}`);
    
    return { success: true };
  } catch (error) {
    console.error('SOS broadcast error:', error);
    return { success: false, error };
  }
}

export default { initSOSService, broadcastSOS };
