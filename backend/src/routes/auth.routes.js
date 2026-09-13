'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } =
  require('../validators/auth.validator');

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

/** POST /auth/register — create a new account */
router.post('/register', validate(registerSchema), authController.register);

/** POST /auth/login — obtain access + refresh tokens */
router.post('/login', rateLimiter.auth, validate(loginSchema), authController.login);

/** POST /auth/refresh — exchange refresh token for a new access token */
router.post('/refresh', authController.refresh);

/** POST /auth/logout — revoke the refresh token session */
router.post('/logout', authController.logout);

/** POST /auth/forgot-password — request a password reset email */
router.post(
  '/forgot-password',
  rateLimiter.auth,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/** POST /auth/reset-password — set a new password using a reset token */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// ---------------------------------------------------------------------------
// Protected routes
// ---------------------------------------------------------------------------

/** GET /auth/me — return the authenticated user's profile */
router.get('/me', authenticate, authController.me);

module.exports = router;
