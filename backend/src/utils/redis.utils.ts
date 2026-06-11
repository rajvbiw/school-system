import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let redisClient: Redis | null = null;
let isMockRedis = false;

// Create actual redis client or mock it
try {
  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      // If failed, disable Redis and fallback to memory cache
      if (times > 2) {
        console.warn('Redis connection failed. Falling back to in-memory cache.');
        isMockRedis = true;
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('error', (err) => {
    // Suppress unhandled errors
    isMockRedis = true;
  });
} catch (error) {
  console.warn('Could not initialize Redis. Using in-memory fallback.');
  isMockRedis = true;
}

// In-Memory cache fallback
const inMemoryCache: Record<string, string> = {};

export const cacheSet = async (key: string, value: string, expireSeconds?: number): Promise<void> => {
  if (redisClient && !isMockRedis) {
    try {
      if (expireSeconds) {
        await redisClient.set(key, value, 'EX', expireSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch (err) {
      isMockRedis = true;
    }
  }
  inMemoryCache[key] = value;
};

export const cacheGet = async (key: string): Promise<string | null> => {
  if (redisClient && !isMockRedis) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      isMockRedis = true;
    }
  }
  return inMemoryCache[key] || null;
};

export const cacheDel = async (key: string): Promise<void> => {
  if (redisClient && !isMockRedis) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      isMockRedis = true;
    }
  }
  delete inMemoryCache[key];
};

export const isRedisConnected = async (): Promise<boolean> => {
  if (isMockRedis || !redisClient) return false;
  try {
    const status = await redisClient.ping();
    return status === 'PONG';
  } catch {
    return false;
  }
};
