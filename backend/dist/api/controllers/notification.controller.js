"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testNotification = exports.sendToUser = exports.sendToRole = exports.registerToken = void 0;
const notification_service_1 = __importDefault(require("../services/notification.service"));
const registerToken = async (req, res) => {
    try {
        const token = req.body?.token;
        if (!token)
            return res.status(400).json({ message: 'token is required' });
        await notification_service_1.default.saveUserToken(req.user.id, token);
        return res.status(200).json({ message: 'Token registered' });
    }
    catch (e) {
        console.error('registerToken error', e);
        return res.status(500).json({ message: 'Failed to register token' });
    }
};
exports.registerToken = registerToken;
const sendToRole = async (req, res) => {
    try {
        const role = String(req.body?.role || '').toLowerCase();
        const title = String(req.body?.title || '');
        const body = String(req.body?.body || '');
        const data = req.body?.data || {};
        const sound = req.body?.sound || 'default';
        const badge = req.body?.badge ? Number(req.body.badge) : undefined;
        if (!role || !title || !body) {
            return res.status(400).json({ message: 'role, title, and body are required' });
        }
        const result = await notification_service_1.default.sendToRole(role, {
            title,
            body,
            data,
            sound,
            badge
        });
        return res.status(200).json({
            message: 'Notification sent',
            result
        });
    }
    catch (e) {
        console.error('sendToRole error', e);
        return res.status(500).json({ message: 'Failed to send notifications' });
    }
};
exports.sendToRole = sendToRole;
const sendToUser = async (req, res) => {
    try {
        const userId = String(req.body?.userId || '');
        const title = String(req.body?.title || '');
        const body = String(req.body?.body || '');
        const data = req.body?.data || {};
        const sound = req.body?.sound || 'default';
        const badge = req.body?.badge ? Number(req.body.badge) : undefined;
        if (!userId || !title || !body) {
            return res.status(400).json({ message: 'userId, title, and body are required' });
        }
        const result = await notification_service_1.default.sendToUser(userId, {
            title,
            body,
            data,
            sound,
            badge
        });
        if (result.success) {
            return res.status(200).json({ message: 'Notification sent', result });
        }
        else {
            return res.status(400).json({ message: result.error || 'Failed to send notification' });
        }
    }
    catch (e) {
        console.error('sendToUser error', e);
        return res.status(500).json({ message: 'Failed to send notification' });
    }
};
exports.sendToUser = sendToUser;
const testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`🧪 Testing notification for user: ${userId}`);
        const result = await notification_service_1.default.sendToUser(userId, {
            title: '🧪 Test Notification',
            body: 'This is a test notification from Connect Me backend!',
            data: { type: 'test', timestamp: new Date().toISOString() },
            sound: 'default',
        });
        if (result.success) {
            return res.status(200).json({
                message: 'Test notification sent successfully',
                result
            });
        }
        else {
            return res.status(400).json({
                message: result.error || 'Failed to send test notification',
                result
            });
        }
    }
    catch (e) {
        console.error('testNotification error', e);
        return res.status(500).json({ message: 'Failed to send test notification' });
    }
};
exports.testNotification = testNotification;
exports.default = { registerToken: exports.registerToken, sendToRole: exports.sendToRole, sendToUser: exports.sendToUser, testNotification: exports.testNotification };
