"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSOS = void 0;
const sos_service_1 = require("../services/sos.service");
const sendSOS = async (req, res) => {
    try {
        const { type, location, routeNumber } = req.body;
        if (!type || !location) {
            return res.status(400).json({ message: 'Type and location required' });
        }
        const sosData = {
            userId: req.user.id,
            type,
            location,
            routeNumber,
            timestamp: new Date().toISOString(),
        };
        const result = await (0, sos_service_1.broadcastSOS)(sosData);
        if (result.success) {
            return res.status(200).json({ success: true, message: 'SOS sent' });
        }
        else {
            return res.status(500).json({ success: false, message: 'Failed to send SOS' });
        }
    }
    catch (error) {
        console.error('SOS error:', error);
        return res.status(500).json({ success: false, message: 'Internal error' });
    }
};
exports.sendSOS = sendSOS;
exports.default = { sendSOS: exports.sendSOS };
