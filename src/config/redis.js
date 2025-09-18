const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

// Initialize Redis client
async function initRedis() {
  try {
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
    
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Get cached data
async function getCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

// Set cache data
async function setCache(key, data, ttl = 300) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
}

// Delete cache
async function deleteCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
}

// Clear all cache with pattern
async function clearCachePattern(pattern) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Cache pattern clear error:', error);
    return false;
  }
}

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  getClient: () => redisClient
};