/**
 * Student Routes
 * POST   /api/v1/students        - Create student (admin only)
 * GET    /api/v1/students        - List students with pagination/filters
 * GET    /api/v1/students/:id    - Get student by ID
 * PUT    /api/v1/students/:id    - Update student (admin only)
 * DELETE /api/v1/students/:id    - Delete student (admin only)
 */

const { Router } = require('express');
const studentService = require('../services/student.service');
const { authenticate } = require('../middleware/auth');
const { adminOnly, teacherOrAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const {
  createStudentSchema, updateStudentSchema, studentQuerySchema, idParamSchema
} = require('../models/schemas');
const { successResponse, paginatedResponse } = require('../utils/serializer');

const router = Router();

// All student routes require authentication
router.use(authenticate);

// POST /api/v1/students
router.post('/',
  adminOnly,
  validate(createStudentSchema),
  async (req, res, next) => {
    try {
      const student = await studentService.createStudent(req.body);
      res.status(201).json(successResponse(student, 'Student created successfully'));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/students
router.get('/',
  teacherOrAdmin,
  validate(studentQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await studentService.getStudents(req.query);
      res.status(200).json(paginatedResponse(result.data, result.pagination));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/students/:id
router.get('/:id',
  teacherOrAdmin,
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const student = await studentService.getStudentById(req.params.id);
      res.status(200).json(successResponse(student));
    } catch (err) { next(err); }
  }
);

// PUT /api/v1/students/:id
router.put('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  validate(updateStudentSchema),
  async (req, res, next) => {
    try {
      const student = await studentService.updateStudent(req.params.id, req.body);
      res.status(200).json(successResponse(student, 'Student updated successfully'));
    } catch (err) { next(err); }
  }
);

// DELETE /api/v1/students/:id
router.delete('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      await studentService.deleteStudent(req.params.id);
      res.status(200).json(successResponse(null, 'Student deleted successfully'));
    } catch (err) { next(err); }
  }
);

module.exports = router;
