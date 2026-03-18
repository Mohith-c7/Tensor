/**
 * Authentication Routes
 * POST /api/v1/auth/login  - Login with email/password
 * POST /api/v1/auth/verify - Verify JWT token
 */

const { Router } = require('express');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validator');
const { loginSchema } = require('../models/schemas');
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
      const result = await authService.login(email, password);
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

module.exports = router;
