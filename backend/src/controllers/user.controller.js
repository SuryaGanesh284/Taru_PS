'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * PATCH /users/me
 * Update the authenticated user's profile fields (name, preferences, avatarUrl).
 * Only the fields supplied in the body are changed.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatarUrl, preferences } = req.body;

    // Build update object — only include supplied fields
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (preferences !== undefined) {
      // Merge nested preferences keys individually to avoid overwriting fields
      // not present in the request
      if (preferences.language !== undefined) update['preferences.language'] = preferences.language;
      if (preferences.notifications !== undefined) {
        const { email, sms, push } = preferences.notifications;
        if (email !== undefined) update['preferences.notifications.email'] = email;
        if (sms !== undefined) update['preferences.notifications.sms'] = sms;
        if (push !== undefined) update['preferences.notifications.push'] = push;
      }
      if (Array.isArray(preferences.categories)) {
        update['preferences.categories'] = preferences.categories;
      }
    }

    if (Object.keys(update).length === 0) {
      throw new AppError('No updatable fields provided', 400, 'NO_UPDATE_FIELDS');
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    return success(res, { user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/me/password
 * Verify current password then set a new one.
 * All existing refresh sessions are revoked for security.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('currentPassword and newPassword are required', 400, 'MISSING_FIELDS');
    }
    if (newPassword.length < 8) {
      throw new AppError('newPassword must be at least 8 characters', 422, 'VALIDATION_ERROR');
    }
    if (currentPassword === newPassword) {
      throw new AppError('New password must differ from current password', 422, 'SAME_PASSWORD');
    }

    // Re-fetch with passwordHash (normally excluded from select)
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');

    // The pre-save hook on User will hash the new password
    user.passwordHash = newPassword;
    await user.save();

    // Revoke all sessions — user must log in again on all devices
    await RefreshSession.updateMany(
      { userId: req.userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    return success(res, { message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users/me/sessions
 * List all active (non-revoked, non-expired) refresh sessions for the user.
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await RefreshSession.find({
      userId: req.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('-tokenHash') // never expose the hash
      .sort({ createdAt: -1 });

    return success(res, { sessions });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /users/me/sessions/:sessionId
 * Revoke a specific session by its ObjectId.
 * Users can only revoke their own sessions.
 */
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await RefreshSession.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.isRevoked) {
      throw new AppError('Session is already revoked', 409, 'SESSION_ALREADY_REVOKED');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();

    return success(res, { message: 'Session revoked successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
};
