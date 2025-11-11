"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../config/redis");
const LOCATION_TTL = 30; // 30 seconds
class CacheService {
    async setLocation(routeNumber, lat, lon) {
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return false;
        try {
            const key = `bus:location:${routeNumber}`;
            const value = JSON.stringify({ lat, lon, timestamp: Date.now() });
            await redis.set(key, value, { ex: LOCATION_TTL });
            return true;
        }
        catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }
    async getLocation(routeNumber) {
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
        try {
            const key = `bus:location:${routeNumber}`;
            const value = await redis.get(key);
            if (typeof value === 'string') {
                return JSON.parse(value);
            }
            return value;
        }
        catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
}
exports.default = new CacheService();
