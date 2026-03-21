/**
 * Classes & Sections Routes
 * GET /api/v1/classes           - List all classes
 * GET /api/v1/classes/:id/sections - List sections for a class
 */

const { Router } = require('express');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/serializer');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .order('id');
    if (error) throw error;
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/sections', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('id, name')
      .eq('class_id', req.params.id)
      .order('name');
    if (error) throw error;
    res.json(successResponse(data));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
