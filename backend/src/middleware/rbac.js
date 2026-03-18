/**
 * RBAC Middleware
 * Role-based access control — restricts routes to specific roles
 * Must be used AFTER authenticate middleware
 */

const logger = require('../config/logger');

// Role hierarchy: admin has all teacher permissions
const ROLE_HIERARCHY = {
  admin: ['admin', 'teacher'],
  teacher: ['teacher']
};

/**
 * Returns middleware that allows only the specified roles
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'teacher')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    const userRoles = ROLE_HIERARCHY[req.user.role] || [];
    const hasPermission = roles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      logger.warn('RBAC access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action'
        }
      });
    }

    next();
  };
}

// Convenience shorthands
const adminOnly = authorize('admin');
const teacherOrAdmin = authorize('admin', 'teacher');

module.exports = { authorize, adminOnly, teacherOrAdmin };
