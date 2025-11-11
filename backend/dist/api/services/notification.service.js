"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../../models/user.model"));
const expo_server_sdk_1 = require("expo-server-sdk");
// Create a new Expo SDK client
const expo = new expo_server_sdk_1.Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for higher rate limits
    useFcmV1: true, // Use FCM v1 API (recommended)
});
/**
 * Validate Expo Push Token format
 */
function isValidExpoPushToken(token) {
    return expo_server_sdk_1.Expo.isExpoPushToken(token);
}
/**
 * Save Expo Push Token for a user with validation
 */
async function saveUserToken(userId, token) {
    // Validate token format
    if (!isValidExpoPushToken(token)) {
        console.error(`❌ Invalid Expo Push Token format: ${token}`);
        throw new Error('Invalid Expo Push Token format');
    }
    const user = await user_model_1.default.findByIdAndUpdate(userId, { expoPushToken: token }, { new: true }).select('name email role expoPushToken');
    if (user) {
        console.log(`✅ Expo Push Token saved for user: ${user.name} (${user.role}) - Token: ${token.substring(0, 30)}...`);
    }
    else {
        console.warn(`⚠️ User not found for ID: ${userId}`);
        throw new Error('User not found');
    }
    return user;
}
/**
 * Send push notification to users with a specific role using Expo Push Notifications
 * Uses expo-server-sdk for better reliability and error handling
 */
async function sendToRole(role, payload) {
    try {
        console.log(`🔔 Attempting to send notification to role: ${role}`);
        // Get users with Expo Push Tokens
        const users = await user_model_1.default.find({
            role,
            expoPushToken: { $exists: true, $ne: null }
        }).select('name email expoPushToken');
        // Filter and validate tokens
        const validTokens = [];
        const invalidTokens = [];
        users.forEach(user => {
            const token = user.expoPushToken;
            if (token && expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                validTokens.push(token);
            }
            else if (token) {
                console.warn(`⚠️ Invalid token format for user ${user.name}: ${token}`);
                invalidTokens.push(token);
            }
        });
        console.log(`📊 Found ${users.length} users with role '${role}'`);
        console.log(`✅ Valid tokens: ${validTokens.length}`);
        console.log(`❌ Invalid tokens: ${invalidTokens.length}`);
        if (validTokens.length === 0) {
            console.warn(`⚠️ No valid Expo Push Tokens found for role: ${role}`);
            return { success: true, sent: 0, failed: 0, invalidTokens: invalidTokens.length };
        }
        console.log(`📤 Sending notification to ${validTokens.length} ${role}(s)...`);
        // Prepare messages for Expo Push API
        const messages = validTokens.map(token => ({
            to: token,
            sound: payload.sound || 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            priority: 'high',
            channelId: 'default',
            badge: payload.badge,
        }));
        // Chunk messages into batches (Expo recommends 100 per batch)
        const chunks = expo.chunkPushNotifications(messages);
        console.log(`📦 Split into ${chunks.length} batches`);
        let totalSent = 0;
        let totalFailed = 0;
        const tickets = [];
        const tokensToRemove = [];
        // Send each batch
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                console.log(`📤 Sending batch ${i + 1}/${chunks.length} (${chunk.length} messages)...`);
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                // Process tickets
                ticketChunk.forEach((ticket, idx) => {
                    if (ticket.status === 'ok') {
                        totalSent++;
                    }
                    else if (ticket.status === 'error') {
                        totalFailed++;
                        console.error(`❌ Error sending notification: ${ticket.message}`);
                        // Handle specific errors
                        if (ticket.details?.error === 'DeviceNotRegistered') {
                            const token = chunk[idx].to;
                            tokensToRemove.push(token);
                            console.warn(`🗑️ Device not registered, will remove token: ${token.substring(0, 30)}...`);
                        }
                    }
                });
                console.log(`✅ Batch ${i + 1} processed: ${ticketChunk.length} tickets received`);
            }
            catch (error) {
                console.error(`❌ Error sending batch ${i + 1}:`, error);
                totalFailed += chunk.length;
            }
        }
        // Remove invalid tokens from database
        if (tokensToRemove.length > 0) {
            await user_model_1.default.updateMany({ expoPushToken: { $in: tokensToRemove } }, { $unset: { expoPushToken: '' } });
            console.log(`🗑️ Removed ${tokensToRemove.length} invalid tokens from database`);
        }
        // Also remove tokens with invalid format
        if (invalidTokens.length > 0) {
            await user_model_1.default.updateMany({ expoPushToken: { $in: invalidTokens } }, { $unset: { expoPushToken: '' } });
            console.log(`🗑️ Removed ${invalidTokens.length} malformed tokens from database`);
        }
        console.log(`📊 Final results: ${totalSent} sent, ${totalFailed} failed`);
        return {
            success: true,
            sent: totalSent,
            failed: totalFailed,
            totalTokens: validTokens.length,
            invalidTokens: invalidTokens.length + tokensToRemove.length,
            tickets
        };
    }
    catch (error) {
        console.error('❌ Error in sendToRole:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            sent: 0,
            failed: 0
        };
    }
}
/**
 * Send push notification to a specific user by ID
 */
async function sendToUser(userId, payload) {
    try {
        console.log(`🔔 Sending notification to user: ${userId}`);
        const user = await user_model_1.default.findById(userId).select('name email expoPushToken');
        if (!user) {
            console.warn(`⚠️ User not found: ${userId}`);
            return { success: false, error: 'User not found' };
        }
        if (!user.expoPushToken) {
            console.warn(`⚠️ User ${user.name} has no push token`);
            return { success: false, error: 'User has no push token' };
        }
        if (!expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
            console.error(`❌ Invalid token format for user ${user.name}`);
            await user_model_1.default.findByIdAndUpdate(userId, { $unset: { expoPushToken: '' } });
            return { success: false, error: 'Invalid token format' };
        }
        const message = {
            to: user.expoPushToken,
            sound: payload.sound || 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            priority: 'high',
            channelId: 'default',
            badge: payload.badge,
        };
        const tickets = await expo.sendPushNotificationsAsync([message]);
        const ticket = tickets[0];
        if (ticket.status === 'ok') {
            console.log(`✅ Notification sent to ${user.name}`);
            return { success: true, ticket };
        }
        else if (ticket.status === 'error') {
            console.error(`❌ Failed to send notification: ${ticket.message}`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
                await user_model_1.default.findByIdAndUpdate(userId, { $unset: { expoPushToken: '' } });
                console.log(`🗑️ Removed invalid token for user ${user.name}`);
            }
            return { success: false, error: ticket.message };
        }
        return { success: false, error: 'Unknown error' };
    }
    catch (error) {
        console.error('❌ Error in sendToUser:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
exports.default = { saveUserToken, sendToRole, sendToUser, isValidExpoPushToken };
