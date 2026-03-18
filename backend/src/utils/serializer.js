/**
 * Serializer Utility
 * Consistent JSON serialization: ISO 8601 dates, null exclusion, numeric coercion
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

/**
 * Serialize a value recursively:
 * - Dates → ISO 8601 strings
 * - Null/undefined values → excluded from objects
 * - Numeric strings → numbers
 * - Arrays → recursively serialized
 * - Objects → recursively serialized with null exclusion
 *
 * @param {*} value
 * @returns {*} serialized value
 */
function serialize(value) {
  if (value === null || value === undefined) return undefined;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(item => serialize(item)).filter(item => item !== undefined);
  }

  if (typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      const serialized = serialize(val);
      if (serialized !== undefined) {
        result[key] = serialized;
      }
    }
    return result;
  }

  // Convert numeric strings to numbers (e.g., "42" → 42, "3.14" → 3.14)
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
    return Number(value);
  }

  return value;
}

/**
 * Build a standard API success response envelope
 * @param {*} data - response payload
 * @param {string} [message] - optional message
 * @param {Object} [meta] - optional metadata (pagination, etc.)
 * @returns {Object} standardized response
 */
function successResponse(data, message = null, meta = null) {
  const response = {
    success: true,
    data: serialize(data)
  };
  if (message) response.message = message;
  if (meta) response.meta = serialize(meta);
  return response;
}

/**
 * Build a standard API error response envelope
 * @param {string} code - error code
 * @param {string} message - human-readable message
 * @param {Object} [fields] - field-level validation errors
 * @returns {Object} standardized error response
 */
function errorResponse(code, message, fields = null) {
  const response = {
    success: false,
    error: { code, message }
  };
  if (fields) response.error.fields = fields;
  return response;
}

/**
 * Build a paginated response
 * @param {Array} data - page of results
 * @param {Object} pagination - { page, limit, total, totalPages }
 * @returns {Object} standardized paginated response
 */
function paginatedResponse(data, pagination) {
  return successResponse(data, null, { pagination });
}

module.exports = { serialize, successResponse, errorResponse, paginatedResponse };
