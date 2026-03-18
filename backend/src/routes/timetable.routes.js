/**
 * Timetable Routes
 * POST   /api/v1/timetable                      - Create entry (admin)
 * GET    /api/v1/timetable/class                - Get class timetable
 * GET    /api/v1/timetable/teacher/:teacherId   - Get teacher timetable
 * PUT    /api/v1/timetable/:id                  - Update entry (admin)
 * DELETE /api/v1/timetable/:id                  - Delete entry (admin)
 */

const { Router } = require('express');
const timetableService = require('../services/timetable.service');
const { authenticate } = require('../middleware/auth');
const { adminOnly, teacherOrAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const {
  createTimetableSchema, updateTimetableSchema, timetableQuerySchema,
  teacherTimetableQuerySchema, idParamSchema, teacherIdParamSchema
} = require('../models/schemas');
const { successResponse } = require('../utils/serializer');

const router = Router();

router.use(authenticate);

// POST /api/v1/timetable
router.post('/',
  adminOnly,
  validate(createTimetableSchema),
  async (req, res, next) => {
    try {
      const entry = await timetableService.createTimetableEntry(req.body);
      res.status(201).json(successResponse(entry, 'Timetable entry created'));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/timetable/class
router.get('/class',
  teacherOrAdmin,
  validate(timetableQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { classId, sectionId, dayOfWeek } = req.query;
      const entries = await timetableService.getClassTimetable(classId, sectionId, { dayOfWeek });
      res.status(200).json(successResponse(entries));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/timetable/teacher/:teacherId
router.get('/teacher/:teacherId',
  teacherOrAdmin,
  validate(teacherIdParamSchema, 'params'),
  validate(teacherTimetableQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const entries = await timetableService.getTeacherTimetable(
        req.params.teacherId,
        req.query
      );
      res.status(200).json(successResponse(entries));
    } catch (err) { next(err); }
  }
);

// PUT /api/v1/timetable/:id
router.put('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  validate(updateTimetableSchema),
  async (req, res, next) => {
    try {
      const entry = await timetableService.updateTimetableEntry(req.params.id, req.body);
      res.status(200).json(successResponse(entry, 'Timetable entry updated'));
    } catch (err) { next(err); }
  }
);

// DELETE /api/v1/timetable/:id
router.delete('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      await timetableService.deleteTimetableEntry(req.params.id);
      res.status(200).json(successResponse(null, 'Timetable entry deleted'));
    } catch (err) { next(err); }
  }
);

module.exports = router;
