/**
 * Property Tests: Validation Schemas
 * Properties 9, 10, 11, 12 — SQL injection prevention, email/phone validation, unknown field rejection
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */

const fc = require('fast-check');
const {
  loginSchema,
  createStudentSchema,
  feePaymentSchema,
  createExamSchema,
  createTimetableSchema
} = require('../../src/models/schemas');

function validate(schema, data) {
  return schema.validate(data, { abortEarly: false, stripUnknown: true, convert: true });
}

// ─── Property 9: SQL Injection Prevention ─────────────────────────────────────

describe('Property 9: SQL Injection Prevention', () => {
  /**
   * Validates: Requirements 3.3
   * SQL injection strings in email/password fields should either be rejected
   * by format validation or safely treated as plain strings (not executed).
   * The schema must not accept obviously malformed emails containing SQL.
   */
  const sqlPatterns = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1; SELECT * FROM users",
    "admin'--",
    "' UNION SELECT * FROM users --"
  ];

  it('SQL injection strings in email field are rejected by email format validation', () => {
    sqlPatterns.forEach(sqlStr => {
      const { error } = validate(loginSchema, { email: sqlStr, password: 'password123' });
      expect(error).toBeDefined();
      const emailError = error.details.find(d => d.path.includes('email'));
      expect(emailError).toBeDefined();
    });
  });

  it('SQL injection in string fields does not bypass schema validation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...sqlPatterns),
        (sqlStr) => {
          // SQL in email should fail email format validation
          const { error } = validate(loginSchema, { email: sqlStr, password: 'password123' });
          expect(error).toBeDefined();
        }
      ),
      { numRuns: sqlPatterns.length }
    );
  });

  it('emails with spaces or control characters are rejected', () => {
    // Spaces and control characters are not valid in email local parts
    const invalidEmails = [
      "test @example.com",   // space not allowed (unquoted)
      "test\t@example.com",  // tab not allowed
      "test\n@example.com",  // newline not allowed
      " @example.com"        // leading space not allowed
    ];
    invalidEmails.forEach(email => {
      const { error } = validate(loginSchema, { email, password: 'password123' });
      expect(error).toBeDefined();
    });
  });
});

// ─── Property 10: Email Format Validation ─────────────────────────────────────

describe('Property 10: Email Format Validation', () => {
  /**
   * Validates: Requirements 3.4
   * Email fields must conform to valid email format.
   */

  it('valid email addresses always pass loginSchema validation', () => {
    // Use emails that Joi's validator accepts (standard format with common TLDs)
    const validEmails = [
      'test@example.com', 'user@domain.org', 'admin@school.edu',
      'info@company.net', 'hello@test.io', 'user123@example.co',
      'first.last@domain.com', 'user+tag@example.org'
    ];
    validEmails.forEach(email => {
      const { error } = validate(loginSchema, { email, password: 'password123' });
      if (error) {
        const emailErrors = error.details.filter(d => d.path.includes('email'));
        expect(emailErrors).toHaveLength(0);
      }
    });
  });

  it('strings without @ always fail email validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
        (badEmail) => {
          const { error } = validate(loginSchema, { email: badEmail, password: 'password123' });
          expect(error).toBeDefined();
          const emailError = error.details.find(d => d.path.includes('email'));
          expect(emailError).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('email without domain part always fails validation', () => {
    const invalidEmails = ['user@', '@domain.com', 'nodomain', 'user@.com', '@'];
    invalidEmails.forEach(email => {
      const { error } = validate(loginSchema, { email, password: 'password123' });
      expect(error).toBeDefined();
      const emailError = error.details.find(d => d.path.includes('email'));
      expect(emailError).toBeDefined();
    });
  });
});

// ─── Property 11: Phone Number Format Validation ──────────────────────────────

describe('Property 11: Phone Number Format Validation', () => {
  /**
   * Validates: Requirements 3.5
   * Phone numbers must contain only digits and allowed separators.
   */

  const validStudentBase = {
    admissionNo: 'ADM001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '2010-01-15',
    gender: 'male',
    classId: 1,
    sectionId: 1,
    admissionDate: '2024-01-10'
  };

  it('valid phone numbers (digits and allowed separators) pass validation', () => {
    const validPhones = [
      '1234567890',
      '+1-234-567-8901',
      '(123) 456-7890',
      '+91 9876543210',
      '123.456.7890'
    ];
    validPhones.forEach(phone => {
      const { error } = validate(createStudentSchema, { ...validStudentBase, phone });
      if (error) {
        const phoneErrors = error.details.filter(d => d.path.includes('phone'));
        expect(phoneErrors).toHaveLength(0);
      }
    });
  });

  it('phone numbers with letters always fail validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 7, maxLength: 15 }).filter(s => /[a-zA-Z]/.test(s)),
        (badPhone) => {
          const { error } = validate(createStudentSchema, { ...validStudentBase, phone: badPhone });
          expect(error).toBeDefined();
          const phoneError = error.details.find(d => d.path.includes('phone'));
          expect(phoneError).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('phone numbers that are too short fail validation', () => {
    const shortPhones = ['123', '12', '1'];
    shortPhones.forEach(phone => {
      const { error } = validate(createStudentSchema, { ...validStudentBase, phone });
      expect(error).toBeDefined();
      const phoneError = error.details.find(d => d.path.includes('phone'));
      expect(phoneError).toBeDefined();
    });
  });
});

// ─── Property 12: Unexpected Field Rejection ──────────────────────────────────

describe('Property 12: Unexpected Field Rejection', () => {
  /**
   * Validates: Requirements 3.6
   * Unknown/unexpected fields should be stripped (not cause errors) when stripUnknown is true.
   * The schema should not pass unknown fields through to the validated value.
   */

  it('unknown fields are stripped from loginSchema output', () => {
    const protoProps = new Set(Object.getOwnPropertyNames(Object.prototype));
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(k =>
          !['email', 'password'].includes(k) && !protoProps.has(k)
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (unknownKey, unknownValue) => {
          const input = {
            email: 'test@example.com',
            password: 'password123',
            [unknownKey]: unknownValue
          };
          const { error, value } = validate(loginSchema, input);
          expect(error).toBeUndefined();
          expect(value[unknownKey]).toBeUndefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('unknown fields are stripped from createStudentSchema output', () => {
    const knownFields = new Set(['admissionNo', 'firstName', 'lastName', 'dateOfBirth', 'gender',
      'classId', 'sectionId', 'admissionDate', 'email', 'phone',
      'address', 'parentName', 'parentPhone', 'parentEmail']);
    const protoProps = new Set(Object.getOwnPropertyNames(Object.prototype));
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(k =>
          !knownFields.has(k) && !protoProps.has(k)
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (unknownKey, unknownValue) => {
          const input = {
            admissionNo: 'ADM001',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '2010-01-15',
            gender: 'male',
            classId: 1,
            sectionId: 1,
            admissionDate: '2024-01-10',
            [unknownKey]: unknownValue
          };
          const { error, value } = validate(createStudentSchema, input);
          // If no other validation errors, unknown field should be stripped
          if (!error) {
            expect(value[unknownKey]).toBeUndefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('known required fields missing always produce validation errors', () => {
    // Missing email in loginSchema
    const { error: e1 } = validate(loginSchema, { password: 'password123' });
    expect(e1).toBeDefined();
    expect(e1.details.find(d => d.path.includes('email'))).toBeDefined();

    // Missing password in loginSchema
    const { error: e2 } = validate(loginSchema, { email: 'test@example.com' });
    expect(e2).toBeDefined();
    expect(e2.details.find(d => d.path.includes('password'))).toBeDefined();
  });
});
