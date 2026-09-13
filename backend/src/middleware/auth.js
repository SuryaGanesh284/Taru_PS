const { verifyAccessToken } = require('../services/auth.service');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Authenticate request — extract Bearer token and populate req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize by role(s)
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'SELLER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
};

/**
 * Optional authentication — populates req.user if valid token is present, but doesn't fail if absent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('-passwordHash');
      if (user && user.status === 'ACTIVE') {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
  } catch (_) {
    // Silently ignore token errors for optional auth
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
