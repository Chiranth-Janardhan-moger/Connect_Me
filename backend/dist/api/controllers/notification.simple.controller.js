"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMaintenanceNotification = void 0;
const notification_simple_service_1 = require("../services/notification.simple.service");
/**
 * Broadcast maintenance notification to ALL users
 * Admin only endpoint
 */
const sendMaintenanceNotification = async (req, res) => {
    try {
        const message = String(req.body?.message || '').trim();
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        console.log(`📢 Admin ${req.user?.id} sending maintenance notification`);
        const result = await (0, notification_simple_service_1.broadcastMaintenance)(message);
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Maintenance notification broadcasted to all users',
                timestamp: result.timestamp
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: result.error || 'Failed to broadcast notification'
            });
        }
    }
    catch (error) {
        console.error('❌ sendMaintenanceNotification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.sendMaintenanceNotification = sendMaintenanceNotification;
exports.default = { sendMaintenanceNotification: exports.sendMaintenanceNotification };
