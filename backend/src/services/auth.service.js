/**
 * Authentication Service
 * Handles login, JWT generation/verification, and password hashing
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/index');
const { supabase } = require('../config/database');
const logger = require('../config/logger');
const { UnauthorizedError, DatabaseError } = require('../utils/errors');

const SALT_ROUNDS = config.bcryptSaltRounds; // minimum 10

class AuthService {
  /**
   * Authenticate user with email + password
   * @param {string} email
   * @param {string} password - plain text
   * @returns {Promise<{token: string, user: Object}>}
   * @throws {UnauthorizedError} on invalid credentials
   */
  async login(email, password) {
    // Fetch user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, first_name, last_name, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(password, '$2b$10$invalidhashpadding000000000000000000000000000000000000');
      logger.warn('Login failed: user not found', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      logger.warn('Login failed: account inactive', { userId: user.id });
      throw new UnauthorizedError('Account is inactive. Contact administrator.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Login failed: wrong password', { userId: user.id });
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);

    logger.info('User logged in', { userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    };
  }

  /**
   * Generate a signed JWT for a user
   * @param {Object} user - must have id, role, email
   * @returns {string} JWT token (expires in 24h)
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn || '24h',
        issuer: 'tensor-school-erp',
        audience: 'tensor-api'
      }
    );
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
}

module.exports = new AuthService();
