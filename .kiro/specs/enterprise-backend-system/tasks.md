# Implementation Plan: Enterprise Backend System

## Overview

This implementation plan transforms the MVP backend into a production-ready enterprise system with comprehensive security, error handling, logging, caching, and testing infrastructure. The implementation follows a layered architecture with clear separation between configuration, middleware, services, routes, and utilities.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize Node.js project with required dependencies
  - Create directory structure following the design specification
  - Set up environment configuration with validation
  - Create configuration loaders for database, cache, and logger
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 2. Database schema and connection management
  - [x] 2.1 Create database schema SQL files
    - Write SQL for all tables (users, students, classes, sections, attendance, fee_structures, fee_payments, exams, marks, timetable, audit_logs)
    - Add indexes on foreign keys and frequently queried fields
    - Add composite indexes for multi-column queries
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 2.2 Implement database connection pool
    - Create `src/config/database.js` with Supabase client configuration
    - Configure connection pool with min 5, max 20 connections
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.3 Implement database utility functions
    - Create `src/utils/database.js` with retry logic and health check
    - Implement executeWithRetry with exponential backoff (3 attempts)
    - Implement healthCheck function for monitoring
    - _Requirements: 7.4, 11.2_

- [x] 3. Core middleware implementation
  - [x] 3.1 Implement CORS middleware
    - Create `src/middleware/cors.js` with origin validation
    - Configure allowed origins from environment variables
    - Support credentials and preflight requests
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 3.2 Implement rate limiter middleware
    - Create `src/middleware/rateLimiter.js` with express-rate-limit
    - Configure authLimiter (5 requests per 15 minutes)
    - Configure apiLimiter (100 requests per 15 minutes)
    - Return 429 status with retry-after header on limit exceeded
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.3 Implement authentication middleware
    - Create `src/middleware/auth.js` with JWT verification
    - Extract and verify JWT token from Authorization header
    - Attach user context (id, role) to request object
    - Return 401 for missing, invalid, or expired tokens
    - _Requirements: 1.4, 1.6, 2.4, 2.5_

  - [ ]* 3.4 Write property test for authentication middleware
    - **Property 4: JWT Token Verification**
    - **Validates: Requirements 1.4**

  - [x] 3.5 Implement RBAC middleware
    - Create `src/middleware/rbac.js` with role-based authorization
    - Define role hierarchy and permission matrix
    - Return 403 for insufficient permissions
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.6 Write property test for RBAC middleware
    - **Property 6: Role-Based Access Control**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.7 Implement request validator middleware
    - Create `src/middleware/validator.js` using Joi
    - Validate request body, query, and params against schemas
    - Return 400 with field-specific errors on validation failure
    - Strip unknown fields and sanitize inputs
    - _Requirements: 3.1, 3.2, 3.6_

  - [ ]* 3.8 Write property test for request validation
    - **Property 8: Request Validation and Error Response**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 3.9 Implement request logger middleware
    - Create `src/middleware/requestLogger.js` with winston
    - Generate unique request ID for each request
    - Log incoming requests with method, path, user ID, timestamp
    - Log outgoing responses with status code and duration
    - _Requirements: 6.1, 6.2_

  - [x] 3.10 Implement error handler middleware
    - Create `src/middleware/errorHandler.js` for centralized error handling
    - Format errors consistently with success, error.code, error.message
    - Include field errors for validation failures
    - Exclude stack traces in production environment
    - Log all errors with full context
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 3.11 Write property test for error handling
    - **Property 13: Error Handling and Formatting**
    - **Validates: Requirements 5.1, 5.2**

- [x] 4. Logging and error utilities
  - [x] 4.1 Implement logger configuration
    - Create `src/config/logger.js` with winston
    - Configure log levels (error, warn, info, http, debug)
    - Set up console and file transports
    - Configure daily log rotation with 30-day retention
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 4.2 Implement custom error classes
    - Create `src/utils/errors.js` with error hierarchy
    - Define ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, RateLimitError, DatabaseError, InternalServerError
    - Include statusCode, code, and isOperational properties
    - _Requirements: 5.2_

- [x] 5. Caching layer implementation
  - [x] 5.1 Implement cache configuration
    - Create `src/config/cache.js` with node-cache
    - Configure default TTL (1 hour) and check period (10 minutes)
    - _Requirements: 9.1_

  - [x] 5.2 Implement cache service utility
    - Create `src/utils/cache.js` with CacheService class
    - Implement get, set, del, delPattern, flush methods
    - Add cache hit/miss logging
    - _Requirements: 9.1, 9.5_

  - [ ]* 5.3 Write property test for cache operations
    - **Property 17: Cache Population on Miss**
    - **Property 18: Cache Invalidation on Modification**
    - **Validates: Requirements 9.1, 9.4, 9.6**

- [x] 6. Validation schemas
  - [x] 6.1 Create validation schemas
    - Create `src/models/schemas.js` with Joi schemas
    - Define studentSchema with all field validations
    - Define attendanceSchema, feeStructureSchema, feePaymentSchema
    - Define examSchema, marksSchema, timetableSchema
    - Define loginSchema with email and password validation
    - _Requirements: 3.4, 3.5_

  - [ ]* 6.2 Write property tests for validation schemas
    - **Property 9: SQL Injection Prevention**
    - **Property 10: Email Format Validation**
    - **Property 11: Phone Number Format Validation**
    - **Property 12: Unexpected Field Rejection**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**

- [ ] 7. Authentication service implementation
  - [ ] 7.1 Implement authentication service
    - Create `src/services/auth.service.js` with AuthService class
    - Implement login method with credential verification
    - Implement generateToken method with 24-hour expiration
    - Implement verifyToken method with signature validation
    - Implement hashPassword method with bcrypt (10+ salt rounds)
    - Implement comparePassword method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 7.2 Write property tests for authentication service
    - **Property 1: JWT Token Generation Completeness**
    - **Property 2: Invalid Credentials Rejection**
    - **Property 3: Password Hashing with bcrypt**
    - **Property 5: JWT Token Expiration Time**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

  - [ ]* 7.3 Write unit tests for authentication service
    - Test login with invalid email returns error
    - Test login with wrong password returns error
    - Test verifyToken with expired token returns 401
    - Test password hashing produces valid bcrypt hash
    - _Requirements: 1.2, 1.6_

- [ ] 8. Student service implementation
  - [ ] 8.1 Implement student service
    - Create `src/services/student.service.js` with StudentService class
    - Implement createStudent with duplicate admission_no check
    - Implement getStudentById with caching
    - Implement getStudents with pagination and filtering
    - Implement updateStudent with cache invalidation
    - Implement deleteStudent with transaction for related records
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.4, 16.2_

  - [ ]* 8.2 Write property test for pagination
    - **Property 16: Pagination Behavior**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 8.3 Write unit tests for student service
    - Test createStudent with duplicate admission_no throws ConflictError
    - Test getStudentById with non-existent ID throws NotFoundError
    - Test getStudents returns paginated results with metadata
    - Test updateStudent invalidates cache
    - Test deleteStudent removes related records atomically
    - _Requirements: 8.2, 8.3, 16.2_

- [ ] 9. Attendance service implementation
  - [ ] 9.1 Implement attendance service
    - Create `src/services/attendance.service.js` with AttendanceService class
    - Implement markAttendance for bulk attendance recording
    - Implement getStudentAttendance with date range filtering
    - Implement getAttendanceStats with percentage calculation
    - Implement getClassAttendance with student details
    - _Requirements: 8.5_

  - [ ]* 9.2 Write unit tests for attendance service
    - Test markAttendance creates multiple records
    - Test getStudentAttendance filters by date range
    - Test getAttendanceStats calculates percentage correctly
    - Test getClassAttendance includes student information

- [ ] 10. Fee service implementation
  - [ ] 10.1 Implement fee service
    - Create `src/services/fee.service.js` with FeeService class
    - Implement createFeeStructure with caching (24-hour TTL)
    - Implement getFeeStructure with cache lookup
    - Implement recordPayment with transaction support
    - Implement getStudentFeeStatus with payment history
    - Implement getPendingFeesReport with filtering
    - _Requirements: 9.3, 16.1_

  - [ ]* 10.2 Write unit tests for fee service
    - Test createFeeStructure caches data with 24-hour TTL
    - Test getFeeStructure returns cached data
    - Test recordPayment updates balance atomically
    - Test getStudentFeeStatus calculates pending amount correctly
    - _Requirements: 9.3, 16.1_

- [ ] 11. Exam service implementation
  - [ ] 11.1 Implement exam service
    - Create `src/services/exam.service.js` with ExamService class
    - Implement createExam with validation
    - Implement enterMarks for bulk marks entry
    - Implement updateMarks with audit logging
    - Implement getStudentResults with exam details
    - Implement getClassResults with statistics
    - Implement getExamStatistics with average, highest, lowest, pass rate
    - _Requirements: 15.3_

  - [ ]* 11.2 Write unit tests for exam service
    - Test enterMarks creates multiple records
    - Test updateMarks creates audit log entry
    - Test getExamStatistics calculates metrics correctly
    - Test getStudentResults includes all exam details
    - _Requirements: 15.3_

- [ ] 12. Timetable service implementation
  - [ ] 12.1 Implement timetable service
    - Create `src/services/timetable.service.js` with TimetableService class
    - Implement createTimetableEntry with caching (1-hour TTL)
    - Implement getClassTimetable with cache lookup
    - Implement getTeacherTimetable with cache lookup
    - Implement updateTimetableEntry with cache invalidation
    - Implement deleteTimetableEntry with cache invalidation
    - _Requirements: 9.2, 9.4_

  - [ ]* 12.2 Write unit tests for timetable service
    - Test createTimetableEntry caches data with 1-hour TTL
    - Test getClassTimetable returns cached data
    - Test updateTimetableEntry invalidates cache
    - Test deleteTimetableEntry invalidates cache
    - _Requirements: 9.2, 9.4_

- [ ] 13. Audit logging implementation
  - [ ] 13.1 Implement audit logger utility
    - Create `src/utils/audit.js` with AuditLogger class
    - Implement log method to create immutable audit entries
    - Implement getLogs method with pagination and filtering
    - Store user ID, timestamp, action, resource type, resource ID, changes
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 13.2 Write property test for audit logging
    - **Property 19: Audit Log Creation for Critical Operations**
    - **Property 20: Audit Log Format Completeness**
    - **Property 21: Audit Log Immutability**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.6**

  - [ ]* 13.3 Write unit tests for audit logger
    - Test log creates entry with all required fields
    - Test audit log entries cannot be modified
    - Test audit log entries cannot be deleted
    - Test getLogs returns paginated results
    - _Requirements: 15.4, 15.6_

- [ ] 14. Serialization utilities
  - [ ] 14.1 Implement serializer utility
    - Create `src/utils/serializer.js` with serialization functions
    - Implement serialize to convert objects to JSON
    - Format dates as ISO 8601 strings
    - Exclude null values from output
    - Convert numeric strings to numbers
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [ ]* 14.2 Write property tests for serialization
    - **Property 24: ISO 8601 Date Formatting**
    - **Property 25: Null Value Exclusion**
    - **Property 26: Numeric Type Conversion**
    - **Property 27: Serialization Round-Trip Idempotence**
    - **Validates: Requirements 17.2, 17.3, 17.4, 17.6**

- [ ] 15. API routes implementation
  - [ ] 15.1 Implement authentication routes
    - Create `src/routes/auth.routes.js`
    - POST /api/v1/auth/login with rate limiting and validation
    - POST /api/v1/auth/verify with authentication middleware
    - _Requirements: 1.1, 1.2, 4.1_

  - [ ] 15.2 Implement student routes
    - Create `src/routes/student.routes.js`
    - POST /api/v1/students (admin only) with validation
    - GET /api/v1/students with pagination and filtering
    - GET /api/v1/students/:id with authentication
    - PUT /api/v1/students/:id (admin only) with validation
    - DELETE /api/v1/students/:id (admin only)
    - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2, 8.6_

  - [ ] 15.3 Implement attendance routes
    - Create `src/routes/attendance.routes.js`
    - POST /api/v1/attendance with validation
    - GET /api/v1/attendance/student/:studentId with date range
    - GET /api/v1/attendance/class with class and section filters
    - _Requirements: 2.3_

  - [ ] 15.4 Implement fee routes
    - Create `src/routes/fee.routes.js`
    - POST /api/v1/fees/structures (admin only) with validation
    - GET /api/v1/fees/structures with class and year filters
    - POST /api/v1/fees/payments (admin only) with validation
    - GET /api/v1/fees/student/:studentId with year filter
    - GET /api/v1/fees/pending (admin only) with filters
    - _Requirements: 2.1, 2.2_

  - [ ] 15.5 Implement exam routes
    - Create `src/routes/exam.routes.js`
    - POST /api/v1/exams (admin only) with validation
    - POST /api/v1/exams/:examId/marks with validation
    - PUT /api/v1/marks/:markId with validation
    - GET /api/v1/exams/student/:studentId with filters
    - GET /api/v1/exams/:examId/results with statistics
    - _Requirements: 2.1, 2.3_

  - [ ] 15.6 Implement timetable routes
    - Create `src/routes/timetable.routes.js`
    - POST /api/v1/timetable (admin only) with validation
    - GET /api/v1/timetable/class with filters
    - GET /api/v1/timetable/teacher/:teacherId with filters
    - PUT /api/v1/timetable/:id (admin only) with validation
    - DELETE /api/v1/timetable/:id (admin only)
    - _Requirements: 2.1, 2.3_

  - [ ] 15.7 Implement health check route
    - Create `src/routes/health.routes.js`
    - GET /health without authentication
    - Return 200 with healthy status when all dependencies operational
    - Return 503 with failure details when dependencies fail
    - Respond within 5 seconds
    - _Requirements: 11.1, 11.3, 11.4, 11.5, 11.6_

  - [ ] 15.8 Create route aggregator
    - Create `src/routes/index.js` to aggregate all routes
    - Mount all route modules with /api/v1 prefix
    - _Requirements: 19.1_

- [ ] 16. Express application setup
  - [ ] 16.1 Create Express app configuration
    - Create `src/app.js` with Express app setup
    - Configure body parsing with 10MB limit
    - Mount middleware in correct order: CORS, request logger, rate limiter, routes, error handler
    - _Requirements: 17.5_

  - [ ] 16.2 Create server entry point
    - Create `src/server.js` with startup and shutdown logic
    - Verify database connection before starting server
    - Implement graceful shutdown with 30-second timeout
    - Handle SIGTERM, SIGINT, uncaughtException, unhandledRejection
    - Close database connections and flush logs on shutdown
    - _Requirements: 7.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 17. API documentation
  - [ ] 17.1 Implement Swagger/OpenAPI documentation
    - Create `src/docs/swagger.js` with OpenAPI 3.0 specification
    - Document all endpoints with request/response schemas
    - Include authentication requirements and error responses
    - Provide example requests and responses
    - Mount documentation at /api-docs endpoint
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 17.2 Write integration test for API documentation
    - Test /api-docs endpoint returns 200
    - Test documentation includes all endpoints
    - Test documentation includes authentication requirements

- [ ] 18. Integration tests
  - [ ] 18.1 Set up test infrastructure
    - Create `tests/setup.js` with test database configuration
    - Implement resetTestDatabase and cleanupTestData functions
    - Implement seedTestData with test users, classes, sections
    - Configure Jest with coverage thresholds (80% minimum)
    - _Requirements: 20.4, 20.5_

  - [ ] 18.2 Write authentication integration tests
    - Test POST /api/v1/auth/login with valid credentials returns token
    - Test POST /api/v1/auth/login with invalid credentials returns 401
    - Test POST /api/v1/auth/login rate limiting (6th request returns 429)
    - Test POST /api/v1/auth/verify with valid token returns 200
    - Test POST /api/v1/auth/verify with expired token returns 401
    - _Requirements: 20.2_

  - [ ] 18.3 Write student integration tests
    - Test POST /api/v1/students as admin creates student
    - Test POST /api/v1/students as teacher returns 403
    - Test POST /api/v1/students with invalid data returns 400
    - Test GET /api/v1/students returns paginated results
    - Test GET /api/v1/students/:id returns student details
    - Test PUT /api/v1/students/:id updates student
    - Test DELETE /api/v1/students/:id removes student and related records
    - _Requirements: 20.2_

  - [ ] 18.4 Write attendance integration tests
    - Test POST /api/v1/attendance creates attendance records
    - Test GET /api/v1/attendance/student/:studentId returns records
    - Test GET /api/v1/attendance/class returns class attendance
    - _Requirements: 20.2_

  - [ ] 18.5 Write fee integration tests
    - Test POST /api/v1/fees/structures creates fee structure
    - Test GET /api/v1/fees/structures returns fee structure
    - Test POST /api/v1/fees/payments records payment
    - Test GET /api/v1/fees/student/:studentId returns fee status
    - Test GET /api/v1/fees/pending returns pending fees report
    - _Requirements: 20.2_

  - [ ] 18.6 Write exam integration tests
    - Test POST /api/v1/exams creates exam
    - Test POST /api/v1/exams/:examId/marks enters marks
    - Test PUT /api/v1/marks/:markId updates marks
    - Test GET /api/v1/exams/student/:studentId returns results
    - Test GET /api/v1/exams/:examId/results returns class results
    - _Requirements: 20.2_

  - [ ] 18.7 Write timetable integration tests
    - Test POST /api/v1/timetable creates timetable entry
    - Test GET /api/v1/timetable/class returns class timetable
    - Test GET /api/v1/timetable/teacher/:teacherId returns teacher timetable
    - Test PUT /api/v1/timetable/:id updates timetable entry
    - Test DELETE /api/v1/timetable/:id deletes timetable entry
    - _Requirements: 20.2_

  - [ ] 18.8 Write health check integration test
    - Test GET /health returns 200 when healthy
    - Test GET /health does not require authentication
    - Test GET /health returns 503 when database disconnected
    - _Requirements: 20.2_

- [ ] 19. Additional property tests
  - [ ]* 19.1 Write property test for transaction atomicity
    - **Property 22: Transaction Atomicity**
    - **Validates: Requirements 16.3, 16.4**

  - [ ]* 19.2 Write property test for JSON response format
    - **Property 23: JSON Response Format**
    - **Validates: Requirements 17.1**

  - [ ]* 19.3 Write property test for database constraints
    - **Property 28: Database Constraint Enforcement**
    - **Validates: Requirements 18.1, 18.2, 18.3**

  - [ ]* 19.4 Write property test for API versioning
    - **Property 29: API Version Header**
    - **Validates: Requirements 19.4**

  - [ ]* 19.5 Write property test for CORS headers
    - **Property 30: CORS Header Inclusion**
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 19.6 Write property test for configuration sensitivity
    - **Property 31: Configuration Sensitivity Protection**
    - **Validates: Requirements 14.4**

- [ ] 20. Deployment configuration
  - [ ] 20.1 Create environment configuration files
    - Create `.env.example` with all required and optional variables
    - Create `.env.development`, `.env.staging`, `.env.production` templates
    - Document each environment variable with description
    - _Requirements: 14.1, 14.2_

  - [ ] 20.2 Create Docker configuration
    - Create `Dockerfile` with Node.js 18 Alpine base image
    - Configure health check using /health endpoint
    - Create `docker-compose.yml` for local development
    - _Requirements: 11.1_

  - [ ] 20.3 Create package.json scripts
    - Add scripts for start, dev, test, test:unit, test:integration, test:property, test:coverage
    - Configure Jest for test execution
    - _Requirements: 20.1, 20.2, 20.3_

  - [ ] 20.4 Create README documentation
    - Document project setup and installation
    - Document environment configuration
    - Document API endpoints and usage
    - Document testing and deployment procedures

- [ ] 21. Final checkpoint - Ensure all tests pass
  - Run all unit tests, integration tests, and property tests
  - Verify code coverage meets 80% threshold
  - Test health check endpoint responds correctly
  - Verify all API endpoints with authentication and authorization
  - Test graceful shutdown behavior
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end API functionality
- The implementation follows a bottom-up approach: configuration → utilities → middleware → services → routes → application
- Checkpoint at the end ensures all components work together correctly
