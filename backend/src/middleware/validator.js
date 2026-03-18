/**
 * Request Validator Middleware
 * Validates req.body, req.query, and req.params against Joi schemas
 * Strips unknown fields and returns field-specific 400 errors
 */

const logger = require('../config/logger');

/**
 * Validate a specific part of the request against a Joi schema
 * @param {Object} schema - Joi schema
 * @param {'body'|'query'|'params'} target - Part of request to validate
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const fields = error.details.reduce((acc, detail) => {
        const key = detail.path.join('.');
        acc[key] = detail.message.replace(/['"]/g, '');
        return acc;
      }, {});

      logger.debug('Validation failed', { target, fields, path: req.path });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          fields
        }
      });
    }

    // Replace with sanitized/coerced value
    req[target] = value;
    next();
  };
}

module.exports = { validate };
