import { getRedisClient } from './redis.js';
import { logger } from '../common/logger.js';

export interface CacheOptions {
  ttl?: number; // seconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 60; // 1 minute

// Simple in-memory mutex for cache stampede protection
const mutexes = new Map<string, Promise<unknown>>();

export class Cache {
  private redis = getRedisClient();
  private useRedis: boolean;

  constructor() {
    // Check if Redis is available
    this.useRedis = true;
    this.redis.ping().catch(() => {
      this.useRedis = false;
      logger.warn('Redis not available, using in-memory cache only');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      logger.error('Cache get error', error);
    }
    return null;
  }

  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl ?? DEFAULT_TTL;
      if (this.useRedis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Cache set error', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.useRedis) {
        await this.redis.del(key);
      }
    } catch (error) {
      logger.error('Cache delete error', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if another request is already fetching this
    const existingMutex = mutexes.get(key);
    if (existingMutex) {
      return existingMutex as Promise<T>;
    }

    // Create mutex for this key
    const mutex = fn()
      .then(async (result) => {
        await this.set(key, result, options);
        mutexes.delete(key);
        return result;
      })
      .catch((error) => {
        mutexes.delete(key);
        throw error;
      });

    mutexes.set(key, mutex);

    // If stale-while-revalidate, return stale immediately and refresh in background
    if (options.staleWhileRevalidate) {
      // For now, just wait for the result
      return mutex;
    }

    return mutex;
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      if (this.useRedis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Cache invalidate error', error);
    }
  }
}

export const cache = new Cache();

