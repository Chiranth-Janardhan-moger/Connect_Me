import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => console.log('Redis connected'));
    redisClient.on('error', (err: Error) => console.error('Redis error:', err));

    return redisClient;
  } catch (error) {
    console.error('Redis init error:', error);
    return null;
  }
};

export const getRedis = () => redisClient;

export default { initRedis, getRedis };
