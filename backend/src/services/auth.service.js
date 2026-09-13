const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const { AppError } = require('../middleware/errorHandler');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

/**
 * Generate a signed access token (short-lived)
 */
const signAccessToken = (userId, role) =>
  jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });

/**
 * Generate a signed refresh token (long-lived, stored hashed in DB)
 */
const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN');
  }
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
};

/**
 * Register a new user
 */
const register = async ({ name, email, phone, password, role = 'BUYER' }) => {
  if (!email && !phone) {
    throw new AppError('Email or phone is required', 400, 'MISSING_CREDENTIALS');
  }

  // Check for existing user
  const existing = await User.findOne({ $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean) });
  if (existing) {
    throw new AppError('User already exists with this email or phone', 409, 'USER_EXISTS');
  }

  const user = await User.create({
    name,
    email: email || undefined,
    phone: phone || undefined,
    passwordHash: password, // pre-save hook will hash
    role: ['BUYER', 'SELLER'].includes(role) ? role : 'BUYER',
  });

  return user;
};

/**
 * Login with email/phone + password
 */
const login = async ({ email, phone, password }, { userAgent, ipAddress } = {}) => {
  if (!email && !phone) {
    throw new AppError('Email or phone is required', 400, 'MISSING_CREDENTIALS');
  }

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+passwordHash');

  if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');

  const valid = await user.comparePassword(password);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // Store hashed refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await RefreshSession.create({ userId: user._id, tokenHash, userAgent, ipAddress, expiresAt });

  return { user, accessToken, refreshToken };
};

/**
 * Refresh access token using a valid refresh token
 */
const refresh = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const session = await RefreshSession.findOne({
    userId: payload.sub,
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) throw new AppError('Refresh token is invalid or revoked', 401, 'INVALID_REFRESH_TOKEN');

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'ACTIVE') throw new AppError('Account not active', 403, 'ACCOUNT_INACTIVE');

  const newAccessToken = signAccessToken(user._id, user.role);
  return { accessToken: newAccessToken, user };
};

/**
 * Revoke a session (logout)
 */
const logout = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshSession.updateOne({ userId: payload.sub, tokenHash }, { isRevoked: true, revokedAt: new Date() });
  } catch (_) {
    // Best-effort revocation; ignore invalid token errors
  }
};

/**
 * Initiate password reset (generates a token)
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return; // Silent to prevent enumeration

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  return { token, user };
};

/**
 * Complete password reset
 */
const resetPassword = async (token, newPassword) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new AppError('Token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');

  user.passwordHash = newPassword; // pre-save hook hashes
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all sessions
  await RefreshSession.updateMany({ userId: user._id }, { isRevoked: true, revokedAt: new Date() });

  return user;
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyAccessToken,
};
