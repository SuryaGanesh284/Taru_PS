const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique requestId to every incoming request.
 * This is returned in all API responses for distributed tracing.
 */
const requestId = (req, res, next) => {
  req.requestId = `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

module.exports = { requestId };
