import Redis from 'ioredis';
import { getEnv } from '../../config/env.js';
import { logger } from '../common/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const env = getEnv();
  const config: Redis.RedisOptions = {};

  if (env.REDIS_URL) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  } else {
    config.host = env.REDIS_HOST;
    config.port = env.REDIS_PORT;
    if (env.REDIS_PASSWORD) {
      config.password = env.REDIS_PASSWORD;
    }
    redisClient = new Redis(config);
  }

  redisClient.on('error', (error) => {
    logger.error('Redis connection error', error);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

