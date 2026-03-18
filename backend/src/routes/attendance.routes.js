/**
 * Attendance Routes
 * POST /api/v1/attendance                          - Mark attendance (bulk)
 * GET  /api/v1/attendance/student/:studentId       - Get student attendance
 * GET  /api/v1/attendance/class                    - Get class attendance
 * GET  /api/v1/attendance/stats/:studentId         - Get attendance stats
 */

const { Router } = require('express');
const attendanceService = require('../services/attendance.service');
const { authenticate } = require('../middleware/auth');
const { teacherOrAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const {
  markAttendanceSchema, attendanceQuerySchema, classAttendanceQuerySchema, studentIdParamSchema
} = require('../models/schemas');
const { successResponse, paginatedResponse } = require('../utils/serializer');

const router = Router();

router.use(authenticate);

// POST /api/v1/attendance
router.post('/',
  teacherOrAdmin,
  validate(markAttendanceSchema),
  async (req, res, next) => {
    try {
      const { records } = req.body;
      const summary = await attendanceService.markAttendance(
        { records },
        req.user.id
      );
      res.status(201).json(successResponse(summary, 'Attendance marked successfully'));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/attendance/student/:studentId
router.get('/student/:studentId',
  teacherOrAdmin,
  validate(studentIdParamSchema, 'params'),
  validate(attendanceQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await attendanceService.getStudentAttendance(
        req.params.studentId,
        req.query
      );
      res.status(200).json(paginatedResponse(result.data, result.pagination));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/attendance/stats/:studentId
router.get('/stats/:studentId',
  teacherOrAdmin,
  validate(studentIdParamSchema, 'params'),
  validate(attendanceQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const stats = await attendanceService.getAttendanceStats(
        req.params.studentId,
        req.query
      );
      res.status(200).json(successResponse(stats));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/attendance/class
router.get('/class',
  teacherOrAdmin,
  validate(classAttendanceQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { classId, sectionId, date, startDate, endDate } = req.query;
      const records = await attendanceService.getClassAttendance(
        classId, sectionId, { date, startDate, endDate }
      );
      res.status(200).json(successResponse(records));
    } catch (err) { next(err); }
  }
);

module.exports = router;
