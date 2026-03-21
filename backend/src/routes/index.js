/**
 * Route Aggregator
 * Mounts all route modules under /api/v1
 */

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const attendanceRoutes = require('./attendance.routes');
const feeRoutes = require('./fee.routes');
const examRoutes = require('./exam.routes');
const timetableRoutes = require('./timetable.routes');
const dashboardRoutes = require('./dashboard.routes');
const classesRoutes = require('./classes.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fees', feeRoutes);
router.use('/exams', examRoutes);
router.use('/timetable', timetableRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/classes', classesRoutes);

module.exports = router;
