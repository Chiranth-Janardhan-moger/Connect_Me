"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = exports.initRedis = void 0;
const redis_1 = require("@upstash/redis");
let redisClient = null;
const initRedis = () => {
    try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (!redisUrl || !redisToken) {
            console.log('Redis not configured (optional) - skipping initialization');
            return;
        }
        redisClient = new redis_1.Redis({
            url: redisUrl,
            token: redisToken,
        });
        console.log('Upstash Redis initialized successfully');
    }
    catch (error) {
        console.error('Redis initialization failed:', error);
        redisClient = null;
    }
};
exports.initRedis = initRedis;
const getRedis = () => redisClient;
exports.getRedis = getRedis;
exports.default = { initRedis: exports.initRedis, getRedis: exports.getRedis };
