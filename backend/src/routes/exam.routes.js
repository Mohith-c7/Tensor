/**
 * Exam Routes
 * POST /api/v1/exams                          - Create exam (admin)
 * POST /api/v1/exams/:examId/marks            - Enter marks (teacher/admin)
 * PUT  /api/v1/marks/:markId                  - Update mark (teacher/admin)
 * GET  /api/v1/exams/student/:studentId       - Get student results
 * GET  /api/v1/exams/:examId/results          - Get class results with stats
 */

const { Router } = require('express');
const examService = require('../services/exam.service');
const { authenticate } = require('../middleware/auth');
const { adminOnly, teacherOrAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const {
  createExamSchema, enterMarksSchema, updateMarksSchema,
  examQuerySchema, examIdParamSchema, markIdParamSchema, studentIdParamSchema
} = require('../models/schemas');
const { successResponse, paginatedResponse } = require('../utils/serializer');

const router = Router();

router.use(authenticate);

// POST /api/v1/exams
router.post('/',
  adminOnly,
  validate(createExamSchema),
  async (req, res, next) => {
    try {
      const exam = await examService.createExam(req.body, req.user.id);
      res.status(201).json(successResponse(exam, 'Exam created successfully'));
    } catch (err) { next(err); }
  }
);

// POST /api/v1/exams/:examId/marks
router.post('/:examId/marks',
  teacherOrAdmin,
  validate(examIdParamSchema, 'params'),
  validate(enterMarksSchema),
  async (req, res, next) => {
    try {
      const summary = await examService.enterMarks(
        req.params.examId,
        req.body.marks,
        req.user.id
      );
      res.status(201).json(successResponse(summary, 'Marks entered successfully'));
    } catch (err) { next(err); }
  }
);

// PUT /api/v1/marks/:markId
router.put('/marks/:markId',
  teacherOrAdmin,
  validate(markIdParamSchema, 'params'),
  validate(updateMarksSchema),
  async (req, res, next) => {
    try {
      const mark = await examService.updateMarks(req.params.markId, req.body, req.user.id);
      res.status(200).json(successResponse(mark, 'Marks updated successfully'));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/exams/student/:studentId
router.get('/student/:studentId',
  teacherOrAdmin,
  validate(studentIdParamSchema, 'params'),
  validate(examQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await examService.getStudentResults(req.params.studentId, req.query);
      res.status(200).json(paginatedResponse(result.data, result.pagination));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/exams/:examId/results
router.get('/:examId/results',
  teacherOrAdmin,
  validate(examIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const results = await examService.getClassResults(req.params.examId);
      res.status(200).json(successResponse(results));
    } catch (err) { next(err); }
  }
);

module.exports = router;
