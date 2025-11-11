"use strict";
// Simple Socket-Only Notification Service
// No Expo Push Tokens, No Registration - Just Real-Time Broadcasting
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNotificationService = initNotificationService;
exports.broadcastMaintenance = broadcastMaintenance;
let io = null;
/**
 * Initialize the notification service with Socket.IO instance
 */
function initNotificationService(socketIO) {
    io = socketIO;
    console.log('✅ Simple notification service initialized');
}
/**
 * Broadcast maintenance notification to ALL connected users
 * No role filtering, no registration - just broadcast
 */
async function broadcastMaintenance(message) {
    if (!io) {
        console.error('❌ Socket.IO not initialized');
        return { success: false, error: 'Socket.IO not initialized' };
    }
    try {
        console.log(`📢 Broadcasting maintenance notification to ALL users`);
        console.log(`📝 Message: ${message}`);
        // Broadcast to everyone connected
        io.emit('maintenance:notification', {
            type: 'maintenance',
            title: 'Maintenance Notice',
            message: message,
            timestamp: new Date().toISOString(),
        });
        console.log(`✅ Maintenance notification broadcasted successfully`);
        return {
            success: true,
            message: 'Notification sent to all connected users',
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('❌ Error broadcasting notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
exports.default = { initNotificationService, broadcastMaintenance };
