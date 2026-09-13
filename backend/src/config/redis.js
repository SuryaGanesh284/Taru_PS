const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  if (client) return client;

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err));
  client.on('close', () => logger.warn('Redis connection closed'));

  try {
    await client.connect();
  } catch (err) {
    logger.warn('Redis not available, some features may be degraded:', err.message);
  }

  return client;
};

const getRedis = () => {
  if (!client) throw new Error('Redis not initialized');
  return client;
};

module.exports = connectRedis;
module.exports.getRedis = getRedis;
