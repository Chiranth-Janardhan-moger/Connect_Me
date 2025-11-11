"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSOS = void 0;
const socket_service_1 = require("../../services/socket.service");
/**
 * Send SOS alert
 */
const sendSOS = async (req, res) => {
    try {
        const { type, location, routeNumber, timestamp } = req.body;
        const user = req.user;
        if (!type || !location || !routeNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const sosData = {
            type,
            location,
            routeNumber,
            timestamp: timestamp || new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            userRole: user.role,
        };
        // Broadcast SOS alert via Socket.IO to admin only
        const io = (0, socket_service_1.getIO)();
        if (io) {
            // Send to admin room only
            io.to('admin').emit('sos:alert', sosData);
            console.log(`SOS alert sent: ${type} from ${user.name} on route ${routeNumber}`);
        }
        res.json({
            success: true,
            message: 'SOS alert sent successfully',
            data: sosData,
        });
    }
    catch (error) {
        console.error('Send SOS error:', error);
        res.status(500).json({ error: 'Failed to send SOS alert' });
    }
};
exports.sendSOS = sendSOS;
