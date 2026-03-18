/**
 * Swagger / OpenAPI 3.0 Documentation
 * Mounted at /api-docs
 * Requirements: 10.1 - 10.6
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tensor School ERP API',
      version: '1.0.0',
      description: 'Enterprise-grade School Management System REST API',
      contact: { name: 'Tensor ERP Team' }
    },
    servers: [
      { url: '/api/v1', description: 'API v1' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /auth/login'
        }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
                fields: { type: 'object', additionalProperties: { type: 'string' } }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 }
              }
            }
          }
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            admissionNo: { type: 'string', example: 'ADM2024001' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            fullName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            classId: { type: 'string', format: 'uuid' },
            className: { type: 'string' },
            sectionId: { type: 'string', format: 'uuid' },
            sectionName: { type: 'string' },
            parentName: { type: 'string' },
            parentPhone: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, error: { code: 'UNAUTHORIZED', message: 'Authorization token is required' } }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Students', description: 'Student management' },
      { name: 'Attendance', description: 'Attendance tracking' },
      { name: 'Fees', description: 'Fee management' },
      { name: 'Exams', description: 'Exam and marks management' },
      { name: 'Timetable', description: 'Timetable management' },
      { name: 'Health', description: 'System health check' }
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@school.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              token: { type: 'string' },
                              user: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  email: { type: 'string' },
                                  role: { type: 'string', enum: ['admin', 'teacher'] },
                                  firstName: { type: 'string' },
                                  lastName: { type: 'string' }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            429: { $ref: '#/components/responses/RateLimitExceeded' }
          }
        }
      },
      '/auth/verify': {
        post: {
          tags: ['Auth'],
          summary: 'Verify JWT token',
          responses: {
            200: { description: 'Token is valid' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/students': {
        get: {
          tags: ['Students'],
          summary: 'List students with pagination and filters',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'classId', in: 'query', schema: { type: 'string' } },
            { name: 'sectionId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } }
          ],
          responses: {
            200: { description: 'Paginated list of students' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        },
        post: {
          tags: ['Students'],
          summary: 'Create a new student (admin only)',
          responses: {
            201: { description: 'Student created' },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            409: { description: 'Duplicate admission number' }
          }
        }
      },
      '/students/{id}': {
        get: {
          tags: ['Students'],
          summary: 'Get student by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Student details' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Students'],
          summary: 'Update student (admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Student updated' },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        delete: {
          tags: ['Students'],
          summary: 'Delete student (admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Student deleted' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/attendance': {
        post: {
          tags: ['Attendance'],
          summary: 'Mark attendance in bulk',
          responses: {
            201: { description: 'Attendance marked' },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/attendance/student/{studentId}': {
        get: {
          tags: ['Attendance'],
          summary: 'Get attendance records for a student',
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            200: { description: 'Attendance records' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/attendance/class': {
        get: {
          tags: ['Attendance'],
          summary: 'Get class attendance',
          parameters: [
            { name: 'classId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'sectionId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            200: { description: 'Class attendance records' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/fees/structures': {
        post: {
          tags: ['Fees'],
          summary: 'Create fee structure (admin only)',
          responses: {
            201: { description: 'Fee structure created' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        get: {
          tags: ['Fees'],
          summary: 'List fee structures',
          responses: {
            200: { description: 'Fee structures' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/fees/payments': {
        post: {
          tags: ['Fees'],
          summary: 'Record a fee payment (admin only)',
          responses: {
            201: { description: 'Payment recorded' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/fees/student/{studentId}': {
        get: {
          tags: ['Fees'],
          summary: 'Get fee status for a student',
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Student fee status' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/fees/pending': {
        get: {
          tags: ['Fees'],
          summary: 'Get pending fees report (admin only)',
          responses: {
            200: { description: 'Pending fees report' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/exams': {
        post: {
          tags: ['Exams'],
          summary: 'Create an exam (admin only)',
          responses: {
            201: { description: 'Exam created' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/exams/{examId}/marks': {
        post: {
          tags: ['Exams'],
          summary: 'Enter marks for an exam',
          parameters: [{ name: 'examId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            201: { description: 'Marks entered' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/exams/marks/{markId}': {
        put: {
          tags: ['Exams'],
          summary: 'Update a mark entry',
          parameters: [{ name: 'markId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Mark updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/exams/student/{studentId}': {
        get: {
          tags: ['Exams'],
          summary: 'Get exam results for a student',
          parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Student results' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/exams/{examId}/results': {
        get: {
          tags: ['Exams'],
          summary: 'Get class results with statistics',
          parameters: [{ name: 'examId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Class results with statistics' },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/timetable': {
        post: {
          tags: ['Timetable'],
          summary: 'Create timetable entry (admin only)',
          responses: {
            201: { description: 'Entry created' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            409: { description: 'Time slot conflict' }
          }
        }
      },
      '/timetable/class': {
        get: {
          tags: ['Timetable'],
          summary: 'Get class timetable',
          parameters: [
            { name: 'classId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'sectionId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'dayOfWeek', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Class timetable' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/timetable/teacher/{teacherId}': {
        get: {
          tags: ['Timetable'],
          summary: 'Get teacher timetable',
          parameters: [{ name: 'teacherId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Teacher timetable' },
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/timetable/{id}': {
        put: {
          tags: ['Timetable'],
          summary: 'Update timetable entry (admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Entry updated' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        delete: {
          tags: ['Timetable'],
          summary: 'Delete timetable entry (admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Entry deleted' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      }
    }
  },
  apis: [] // Using inline definition above
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Mount Swagger UI on an Express app
 * @param {import('express').Application} app
 */
function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Tensor ERP API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Expose raw spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = { setupSwagger, swaggerSpec };
