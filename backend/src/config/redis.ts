import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export const initRedis = () => {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.log('Redis not configured (optional) - skipping initialization');
      return;
    }
    
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    console.log('Upstash Redis initialized successfully');
  } catch (error) {
    console.error('Redis initialization failed:', error);
    redisClient = null;
  }
};

export const getRedis = () => redisClient;

export default { initRedis, getRedis };
