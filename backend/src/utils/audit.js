/**
 * Audit Logger Utility
 * Immutable audit trail for critical operations
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const { DatabaseError } = require('./errors');

class AuditLogger {
  /**
   * Create an immutable audit log entry
   * @param {Object} params
   * @param {string} params.userId - ID of the user performing the action
   * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)
   * @param {string} params.resourceType - Type of resource (students, marks, users, etc.)
   * @param {string} [params.resourceId] - ID of the affected resource
   * @param {Object} [params.changes] - { before, after } snapshot of changes
   * @param {string} [params.ipAddress] - Client IP address
   * @param {string} [params.userAgent] - Client user agent
   * @returns {Promise<Object>} created audit log entry
   */
  async log({ userId, action, resourceType, resourceId = null, changes = null, ipAddress = null, userAgent = null }) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: action.toUpperCase(),
          resource_type: resourceType,
          resource_id: resourceId,
          changes: changes ? JSON.stringify(changes) : null,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        })
        .select('id, user_id, action, resource_type, resource_id, created_at')
        .single();

      if (error) {
        // Audit failures should not crash the application — log to file instead
        logger.error('Failed to write audit log to database', {
          error: error.message,
          userId,
          action,
          resourceType,
          resourceId
        });
        return null;
      }

      logger.debug('Audit log created', { auditId: data.id, action, resourceType });
      return this._format(data);
    } catch (err) {
      logger.error('Audit log exception', { error: err.message, userId, action });
      return null; // Non-blocking — never throw from audit
    }
  }

  /**
   * Retrieve audit logs with pagination and filtering
   * @param {Object} options - { userId, action, resourceType, resourceId, startDate, endDate, page, limit }
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getLogs({ userId, action, resourceType, resourceId, startDate, endDate, page = 1, limit = 50 } = {}) {
    const pageSize = Math.min(limit, 100);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('audit_logs')
      .select(`
        id, user_id, action, resource_type, resource_id, changes,
        ip_address, user_agent, created_at,
        users(id, first_name, last_name, email, role)
      `, { count: 'exact' });

    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action.toUpperCase());
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      logger.error('Failed to fetch audit logs', { error: error.message });
      throw new DatabaseError('Failed to fetch audit logs');
    }

    return {
      data: (data || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        user: r.users ? {
          id: r.users.id,
          fullName: `${r.users.first_name} ${r.users.last_name}`,
          email: r.users.email,
          role: r.users.role
        } : null,
        action: r.action,
        resourceType: r.resource_type,
        resourceId: r.resource_id,
        changes: r.changes ? JSON.parse(r.changes) : null,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        createdAt: r.created_at
      })),
      pagination: {
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    };
  }

  /** @private */
  _format(r) {
    return {
      id: r.id,
      userId: r.user_id,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      createdAt: r.created_at
    };
  }
}

module.exports = new AuditLogger();
