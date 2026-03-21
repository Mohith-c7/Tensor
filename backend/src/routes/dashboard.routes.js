/**
 * Dashboard Routes
 * GET /api/v1/dashboard/kpis
 * GET /api/v1/dashboard/attendance-trend
 * GET /api/v1/dashboard/fee-collection
 * GET /api/v1/dashboard/recent-activity
 */

const { Router } = require('express');
const dashboardService = require('../services/dashboard.service');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/serializer');

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/kpis', async (req, res, next) => {
  try {
    const data = await dashboardService.getKPIs();
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

router.get('/attendance-trend', async (req, res, next) => {
  try {
    const data = await dashboardService.getAttendanceTrend();
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

router.get('/fee-collection', async (req, res, next) => {
  try {
    const data = await dashboardService.getFeeCollection();
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

router.get('/recent-activity', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data = await dashboardService.getRecentActivity(limit);
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
