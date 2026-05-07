/**
 * Authentication Service
 * Handles login, JWT generation/verification, password hashing, password reset,
 * refresh tokens, and session management
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/index');
const { supabase } = require('../config/database');
const logger = require('../config/logger');
const { UnauthorizedError, DatabaseError, NotFoundError, ValidationError } = require('../utils/errors');

const SALT_ROUNDS = config.bcryptSaltRounds; // minimum 10
const PASSWORD_RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

class AuthService {
  /**
   * Authenticate user with email + password
   * @param {string} email
   * @param {string} password - plain text
   * @param {Object} context - { ipAddress, userAgent }
   * @returns {Promise<{accessToken: string, refreshToken: string, user: Object}>}
   * @throws {UnauthorizedError} on invalid credentials
   */
  async login(email, password, context = {}) {
    const emailLower = email.toLowerCase().trim();

    // Check if account is locked
    const { data: user } = await supabase
      .from('users')
      .select('id, email, password_hash, role, first_name, last_name, is_active, locked_until, failed_login_attempts')
      .eq('email', emailLower)
      .single();

    if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
      logger.warn('Login failed: account locked', { email: emailLower });
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    // Fetch user by email
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, first_name, last_name, is_active')
      .eq('email', emailLower)
      .single();

    if (error || !userData) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(password, '$2b$10$invalidhashpadding000000000000000000000000000000000000');
      logger.warn('Login failed: user not found', { email: emailLower });
      
      // Track failed login attempt
      await this._trackLoginAttempt(emailLower, false, context);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!userData.is_active) {
      logger.warn('Login failed: account inactive', { userId: userData.id });
      throw new UnauthorizedError('Account is inactive. Contact administrator.');
    }

    const passwordMatch = await bcrypt.compare(password, userData.password_hash);
    if (!passwordMatch) {
      logger.warn('Login failed: wrong password', { userId: userData.id });
      
      // Track failed login attempt and increment counter
      await this._incrementFailedLoginAttempts(userData.id);
      await this._trackLoginAttempt(emailLower, false, context);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed login attempts on successful login
    await supabase
      .from('users')
      .update({ failed_login_attempts: 0, locked_until: null, last_login: new Date().toISOString() })
      .eq('id', userData.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(userData);
    const refreshToken = await this.generateRefreshToken(userData.id, context);

    // Track successful login
    await this._trackLoginAttempt(emailLower, true, context);

    logger.info('User logged in', { userId: userData.id, role: userData.role });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.first_name,
        lastName: userData.last_name
      }
    };
  }

  /**
   * Generate an access token (short-lived, 24h)
   * @param {Object} user - must have id, role, email
   * @returns {string} JWT token
   */
  generateAccessToken(user) {
    const jti = crypto.randomBytes(16).toString('hex');
    return jwt.sign(
      { userId: user.id, role: user.role, email: user.email, jti },
      config.jwtSecret,
      {
        expiresIn: '24h',
        issuer: 'tensor-school-erp',
        audience: 'tensor-api'
      }
    );
  }

  /**
   * Generate a refresh token (long-lived, 7d) and store in DB
   * @param {number} userId
   * @param {Object} context - { ipAddress, userAgent }
   * @returns {Promise<string>} refresh token
   */
  async generateRefreshToken(userId, context = {}) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
    const jti = crypto.randomBytes(16).toString('hex');

    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        refresh_token: token,
        access_token_jti: jti,
        expires_at: expiresAt.toISOString(),
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null
      });

    if (error) {
      logger.error('Failed to create refresh token', { error: error.message });
      throw new DatabaseError('Failed to create session');
    }

    return token;
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshAccessToken(refreshToken) {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('refresh_token', refreshToken)
      .single();

    if (error || !session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('sessions').delete().eq('refresh_token', refreshToken);
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      throw new NotFoundError('User');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    // Optionally rotate refresh token
    const newRefreshToken = await this.generateRefreshToken(user.id);
    await supabase.from('sessions').delete().eq('refresh_token', refreshToken);

    logger.info('Access token refreshed', { userId: user.id });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke a refresh token (logout)
   * @param {string} refreshToken
   */
  async revokeRefreshToken(refreshToken) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', refreshToken);

    if (error) {
      logger.error('Failed to revoke refresh token', { error: error.message });
      throw new DatabaseError('Failed to revoke session');
    }

    logger.info('Refresh token revoked');
  }

  /**
   * Revoke all sessions for a user (logout all devices)
   * @param {number} userId
   */
  async revokeAllSessions(userId) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to revoke all sessions', { error: error.message });
      throw new DatabaseError('Failed to revoke all sessions');
    }

    logger.info('All sessions revoked', { userId });
  }

  /**
   * Request password reset (send email with token)
   * @param {string} email
   * @param {Object} context - { ipAddress }
   * @returns {Promise<void>}
   */
  async requestPasswordReset(email, context = {}) {
    const emailLower = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', emailLower)
      .single();

    if (error || !user) {
      // Don't reveal if email exists (security)
      logger.warn('Password reset requested for non-existent email', { email: emailLower });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        ip_address: context.ipAddress || null
      });

    if (insertError) {
      logger.error('Failed to create password reset token', { error: insertError.message });
      throw new DatabaseError('Failed to request password reset');
    }

    // TODO: Send email with reset link
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendPasswordResetEmail(user.email, resetLink);

    logger.info('Password reset requested', { userId: user.id });
  }

  /**
   * Verify password reset token
   * @param {string} token
   * @returns {Promise<{userId: number, email: string}>}
   */
  async verifyPasswordResetToken(token) {
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (error || !resetToken) {
      throw new UnauthorizedError('Invalid reset token');
    }

    if (resetToken.used_at) {
      throw new UnauthorizedError('Reset token has already been used');
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new UnauthorizedError('Reset token has expired');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user) {
      throw new NotFoundError('User');
    }

    return { userId: user.id, email: user.email };
  }

  /**
   * Reset password with token
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    // Validate password strength
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const { userId } = await this.verifyPasswordResetToken(token);

    const passwordHash = await this.hashPassword(newPassword);

    // Update password and mark token as used
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to reset password', { error: updateError.message });
      throw new DatabaseError('Failed to reset password');
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Revoke all sessions (force re-login)
    await this.revokeAllSessions(userId);

    logger.info('Password reset successful', { userId });
  }

  /**
   * Change password (authenticated user)
   * @param {number} userId
   * @param {string} oldPassword
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (oldPassword === newPassword) {
      throw new ValidationError('New password must be different from old password');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundError('User');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (updateError) {
      logger.error('Failed to change password', { error: updateError.message });
      throw new DatabaseError('Failed to change password');
    }

    logger.info('Password changed', { userId });
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token
   * @returns {Object} decoded payload
   * @throws {UnauthorizedError} on invalid or expired token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret, {
        issuer: 'tensor-school-erp',
        audience: 'tensor-api'
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  /**
   * Hash a plain-text password with bcrypt
   * @param {string} password
   * @returns {Promise<string>} bcrypt hash
   */
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare plain-text password against a bcrypt hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user (admin-controlled)
   * @param {Object} userData - { email, password, role, firstName, lastName, phone }
   * @returns {Promise<Object>} created user (without password_hash)
   */
  async register(userData) {
    const { email, password, role, firstName, lastName, phone } = userData;

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      const { ConflictError } = require('../utils/errors');
      throw new ConflictError(`User with email ${email} already exists`);
    }

    const passwordHash = await this.hashPassword(password);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null
      })
      .select('id, email, role, first_name, last_name, created_at')
      .single();

    if (error) {
      logger.error('User registration failed', { error: error.message });
      throw new DatabaseError('Failed to create user');
    }

    logger.info('New user registered', { userId: newUser.id, role: newUser.role });
    return newUser;
  }

  /**
   * @private
   * Track login attempt for security monitoring
   */
  async _trackLoginAttempt(email, success, context = {}) {
    const { error } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null
      });

    if (error) {
      logger.warn('Failed to track login attempt', { error: error.message });
    }
  }

  /**
   * @private
   * Increment failed login attempts and lock account if needed
   */
  async _incrementFailedLoginAttempts(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('failed_login_attempts')
      .eq('id', userId)
      .single();

    if (!user) return;

    const newAttempts = (user.failed_login_attempts || 0) + 1;
    const updates = { failed_login_attempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
      logger.warn('Account locked due to failed login attempts', { userId });
    }

    await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  }
}

module.exports = new AuthService();
