'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

// All user routes require a valid access token
router.use(authenticate);

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** PATCH /users/me — update name, avatarUrl, or preferences */
router.patch('/me', userController.updateProfile);

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

/** PATCH /users/me/password — change password (verifies current password first) */
router.patch('/me/password', userController.changePassword);

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/** GET /users/me/sessions — list all active refresh sessions */
router.get('/me/sessions', userController.getSessions);

/** DELETE /users/me/sessions/:sessionId — revoke a specific session */
router.delete('/me/sessions/:sessionId', userController.revokeSession);

module.exports = router;
