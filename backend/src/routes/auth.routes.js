/**
 * Authentication Routes
 * POST /api/v1/auth/login              - Login with email/password
 * POST /api/v1/auth/verify             - Verify JWT token
 * POST /api/v1/auth/refresh            - Refresh access token
 * POST /api/v1/auth/logout             - Logout (revoke refresh token)
 * POST /api/v1/auth/forgot-password    - Request password reset
 * POST /api/v1/auth/reset-password     - Reset password with token
 * POST /api/v1/auth/change-password    - Change password (authenticated)
 * POST /api/v1/auth/revoke-all         - Revoke all sessions
 */

const { Router } = require('express');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validator');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, refreshTokenSchema } = require('../models/schemas');
const { successResponse } = require('../utils/serializer');

const router = Router();

/**
 * POST /api/v1/auth/login
 * Rate limited: 5 requests per 15 minutes
 */
router.post('/login',
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };
      const result = await authService.login(email, password, context);
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/verify
 * Verifies the current token and returns user info
 */
router.post('/verify',
  authenticate,
  (req, res) => {
    res.status(200).json(successResponse({ user: req.user }, 'Token is valid'));
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  validate(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      res.status(200).json(successResponse(result, 'Token refreshed successfully'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout by revoking refresh token
 */
router.post('/logout',
  authenticate,
  validate(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      await authService.revokeRefreshToken(refreshToken);
      res.status(200).json(successResponse(null, 'Logged out successfully'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset (send email)
 * Rate limited: 3 requests per 15 minutes
 */
router.post('/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const context = { ipAddress: req.ip };
      await authService.requestPasswordReset(email, context);
      // Always return success (don't reveal if email exists)
      res.status(200).json(successResponse(null, 'If an account exists, a password reset email has been sent'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.status(200).json(successResponse(null, 'Password reset successfully. Please log in with your new password.'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/change-password
 * Change password (authenticated user)
 */
router.post('/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, oldPassword, newPassword);
      res.status(200).json(successResponse(null, 'Password changed successfully'));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/revoke-all
 * Revoke all sessions (logout all devices)
 */
router.post('/revoke-all',
  authenticate,
  async (req, res, next) => {
    try {
      await authService.revokeAllSessions(req.user.id);
      res.status(200).json(successResponse(null, 'All sessions revoked. Please log in again.'));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
