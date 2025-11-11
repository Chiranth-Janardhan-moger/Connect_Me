"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSOSService = initSOSService;
exports.broadcastSOS = broadcastSOS;
let io = null;
function initSOSService(socketIO) {
    io = socketIO;
}
async function broadcastSOS(data) {
    if (!io)
        return { success: false, error: 'Socket not initialized' };
    try {
        // Broadcast to admin
        io.emit('sos:alert:admin', data);
        // Broadcast to drivers on same route
        if (data.routeNumber) {
            io.to(`driver:${data.routeNumber}`).emit('sos:alert:driver', data);
        }
        console.log(`🚨 SOS broadcasted: ${data.type} on route ${data.routeNumber}`);
        return { success: true };
    }
    catch (error) {
        console.error('SOS broadcast error:', error);
        return { success: false, error };
    }
}
exports.default = { initSOSService, broadcastSOS };
