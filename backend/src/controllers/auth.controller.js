'use strict';

const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  path: '/',
};

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /auth/register
 * Create a new user account.
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    // Auto-login after registration — generate tokens
    const { accessToken, refreshToken } = await authService.login(
      { email: req.body.email, phone: req.body.phone, password: req.body.password },
      { userAgent: req.headers['user-agent'], ipAddress: req.ip }
    );

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions);

    return created(res, {
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * Authenticate with email/phone + password.
 */
const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions);

    return success(res, {
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 * Exchange a valid refresh token for a new access token.
 * Reads from cookie first, falls back to body.
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    const { accessToken, user } = await authService.refresh(token);

    return success(res, { accessToken, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 * Revoke refresh token and clear cookie.
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    await authService.logout(token); // best-effort; ignores invalid tokens

    res.clearCookie(COOKIE_NAME, clearCookieOptions);

    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 * Return authenticated user's profile (requires authenticate middleware).
 */
const me = async (req, res, next) => {
  try {
    return success(res, { user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/forgot-password
 * Initiate password reset. In development, return the token in the response
 * so it can be tested without an email server.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);

    if (process.env.NODE_ENV !== 'production' && result?.token) {
      // Expose reset token only in dev/test environments
      return success(res, {
        message: 'Password reset token generated (dev mode)',
        resetToken: result.token,
      });
    }

    // Production: always return a generic message to prevent email enumeration
    return success(res, {
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/reset-password
 * Complete password reset using the one-time token.
 */
const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);

    // Clear any lingering refresh token cookie since all sessions are revoked
    res.clearCookie(COOKIE_NAME, clearCookieOptions);

    return success(res, { message: 'Password reset successful. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
