const rateLimit = require('express-rate-limit');

const createLimiter = (options) => {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          requestId: req.requestId,
        },
      });
    },
    ...options,
  });
};

const rateLimiter = {
  // Default: 100 requests per minute per IP
  global: createLimiter({ windowMs: 60 * 1000, max: 100 }),

  // Auth endpoints: stricter (20 per 15 minutes)
  auth: createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),

  // AI endpoints: moderate (30 per minute)
  ai: createLimiter({ windowMs: 60 * 1000, max: 30 }),

  // Search: 60 per minute
  search: createLimiter({ windowMs: 60 * 1000, max: 60 }),

  // Payment: 10 per minute
  payment: createLimiter({ windowMs: 60 * 1000, max: 10 }),
};

module.exports = rateLimiter;
