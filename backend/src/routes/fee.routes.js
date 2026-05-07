/**
 * Fee Routes
 * POST /api/v1/fees/structures              - Create fee structure (admin)
 * GET  /api/v1/fees/structures              - List fee structures
 * POST /api/v1/fees/payments                - Record payment (admin)
 * GET  /api/v1/fees/student/:studentId      - Get student fee status
 * GET  /api/v1/fees/pending                 - Pending fees report (admin)
 */

const { Router } = require('express');
const feeService = require('../services/fee.service');
const { authenticate } = require('../middleware/auth');
const { adminOnly, teacherOrAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const {
  feeStructureSchema, feeStructureQuerySchema, feePaymentSchema, studentIdParamSchema
} = require('../models/schemas');
const { successResponse, paginatedResponse } = require('../utils/serializer');
const Joi = require('joi');

const router = Router();

router.use(authenticate);

// POST /api/v1/fees/structures
router.post('/structures',
  adminOnly,
  validate(feeStructureSchema),
  async (req, res, next) => {
    try {
      const structure = await feeService.createFeeStructure(req.body);
      res.status(201).json(successResponse(structure, 'Fee structure created'));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/fees/structures
router.get('/structures',
  teacherOrAdmin,
  validate(feeStructureQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await feeService.getFeeStructures(req.query);
      res.status(200).json(paginatedResponse(result.data, result.pagination));
    } catch (err) { next(err); }
  }
);

// POST /api/v1/fees/payments
router.post('/payments',
  adminOnly,
  validate(feePaymentSchema),
  async (req, res, next) => {
    try {
      const payment = await feeService.recordPayment(req.body, req.user.id);
      res.status(201).json(successResponse(payment, 'Payment recorded successfully'));
    } catch (err) { next(err); }
  }
);
// GET /api/v1/fees/student/:studentId
router.get('/student/:studentId',
  teacherOrAdmin,
  validate(studentIdParamSchema, 'params'),
  validate(Joi.object({ academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional() }), 'query'),
  async (req, res, next) => {
    try {
      const status = await feeService.getStudentFeeStatus(req.params.studentId, req.query);
      res.status(200).json(successResponse(status));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/fees/pending
router.get('/pending',
  adminOnly,
  validate(Joi.object({
    classId: Joi.number().integer().positive().optional(),
    academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }), 'query'),
  async (req, res, next) => {
    try {
      const result = await feeService.getPendingFeesReport(req.query);
      res.status(200).json(paginatedResponse(result.data, result.pagination));
    } catch (err) { next(err); }
  }
);

// GET /api/v1/fees/class/:classId/summary
router.get('/class/:classId/summary',
  teacherOrAdmin,
  validate(Joi.object({ classId: Joi.number().integer().positive().required() }), 'params'),
  validate(Joi.object({ year: Joi.string().pattern(/^\d{4}-\d{4}$/).optional() }), 'query'),
  async (req, res, next) => {
    try {
      const summary = await feeService.getClassFeesSummary(req.params.classId, req.query);
      res.status(200).json(successResponse(summary));
    } catch (err) { next(err); }
  }
);

module.exports = router;
