const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * In-memory fallback client when Redis server is unavailable or disabled.
 * Emulates the essential ioredis interface so caller functions continue working seamlessly.
 */
class MemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.timeouts = new Map();
    this.status = 'ready';
    this.isFallback = true;
  }

  async get(key) {
    const val = this.store.get(key);
    return val !== undefined ? val : null;
  }

  async set(key, value, ...args) {
    this.store.set(key, String(value));
    if (args.length >= 2) {
      const mode = String(args[0]).toUpperCase();
      const duration = parseInt(args[1], 10);
      if (mode === 'EX' && !isNaN(duration)) {
        this.expire(key, duration);
      } else if (mode === 'PX' && !isNaN(duration)) {
        this.pexpire(key, duration);
      }
    }
    return 'OK';
  }

  async setex(key, seconds, value) {
    return this.set(key, value, 'EX', seconds);
  }

  async del(...keys) {
    let count = 0;
    const flatKeys = keys.flat();
    for (const key of flatKeys) {
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
        this.timeouts.delete(key);
      }
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async expire(key, seconds) {
    if (!this.store.has(key)) return 0;
    if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timeouts.delete(key);
    }, seconds * 1000);
    if (timer.unref) timer.unref();
    this.timeouts.set(key, timer);
    return 1;
  }

  async pexpire(key, ms) {
    if (!this.store.has(key)) return 0;
    if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timeouts.delete(key);
    }, ms);
    if (timer.unref) timer.unref();
    this.timeouts.set(key, timer);
    return 1;
  }

  async ttl(key) {
    return this.store.has(key) ? -1 : -2;
  }

  async exists(...keys) {
    return keys.flat().filter((k) => this.store.has(k)).length;
  }

  async mget(...keys) {
    return keys.flat().map((k) => (this.store.has(k) ? this.store.get(k) : null));
  }

  async mset(...keyValues) {
    const list = keyValues.flat();
    for (let i = 0; i < list.length; i += 2) {
      this.store.set(list[i], String(list[i + 1]));
    }
    return 'OK';
  }

  async incr(key) {
    const val = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, String(val));
    return val;
  }

  async decr(key) {
    const val = parseInt(this.store.get(key) || '0', 10) - 1;
    this.store.set(key, String(val));
    return val;
  }

  async flushall() {
    this.store.clear();
    for (const timer of this.timeouts.values()) clearTimeout(timer);
    this.timeouts.clear();
    return 'OK';
  }

  async ping() {
    return 'PONG';
  }

  async quit() {
    this.status = 'end';
    return 'OK';
  }

  disconnect() {
    this.status = 'end';
  }

  on() {
    return this;
  }

  removeListener() {
    return this;
  }
}

let client = null;
let isConnected = false;

const connectRedis = async () => {
  if (client) return client;

  // If Redis is explicitly disabled via env
  if (process.env.REDIS_ENABLED === 'false') {
    logger.info('Redis disabled by configuration. Operating in graceful fallback mode.');
    client = new MemoryRedisFallback();
    isConnected = false;
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let candidate = null;

  try {
    candidate = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: () => null, // Stop reconnect loop on initial failure
    });

    const initialErrorHandler = () => {};
    candidate.on('error', initialErrorHandler);

    await candidate.connect();

    // Successfully connected
    candidate.removeListener('error', initialErrorHandler);
    candidate.on('error', (err) => logger.error('Redis error:', err));
    candidate.on('close', () => logger.warn('Redis connection closed'));

    logger.info('Redis connected successfully');
    client = candidate;
    isConnected = true;
    return client;
  } catch (err) {
    try {
      if (candidate) {
        candidate.removeAllListeners();
        candidate.on('error', () => {});
        candidate.disconnect();
      }
    } catch (_) {}

    logger.info('Redis server not available. Graceful in-memory fallback active.');
    client = new MemoryRedisFallback();
    isConnected = false;
    return client;
  }
};

const getRedis = () => {
  if (!client) {
    client = new MemoryRedisFallback();
  }
  return client;
};

const isRedisConnected = () => isConnected;

module.exports = connectRedis;
module.exports.getRedis = getRedis;
module.exports.isRedisConnected = isRedisConnected;
module.exports.MemoryRedisFallback = MemoryRedisFallback;
