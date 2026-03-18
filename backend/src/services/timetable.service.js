/**
 * Timetable Service
 * Timetable entry management with caching
 * Requirements: 9.2, 9.4
 * Schema: timetable(id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject, teacher_id, room_number)
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const cache = require('../utils/cache');
const { NotFoundError, DatabaseError, ConflictError } = require('../utils/errors');
const config = require('../config/index');

const CLASS_TT_PREFIX = 'timetable:class';
const TEACHER_TT_PREFIX = 'timetable:teacher';
const ENTRY_PREFIX = 'timetable:entry';
const TTL = config.cacheClassTtl; // 1 hour

const TT_SELECT = `
  *, classes(name), sections(name),
  users!timetable_teacher_id_fkey(id, first_name, last_name)
`;

class TimetableService {
  async createTimetableEntry(data) {
    // Check for period conflict (unique constraint: class_id, section_id, day_of_week, period_number)
    const { data: conflict } = await supabase
      .from('timetable')
      .select('id')
      .eq('class_id', data.classId)
      .eq('section_id', data.sectionId)
      .eq('day_of_week', data.dayOfWeek)
      .eq('period_number', data.periodNumber)
      .limit(1);

    if (conflict && conflict.length > 0) {
      throw new ConflictError('Period conflict: another entry exists for this class/section/day/period');
    }

    const { data: entry, error } = await supabase
      .from('timetable')
      .insert({
        class_id: data.classId,
        section_id: data.sectionId,
        subject: data.subject,
        teacher_id: data.teacherId || null,
        day_of_week: data.dayOfWeek,
        period_number: data.periodNumber,
        start_time: data.startTime,
        end_time: data.endTime,
        room_number: data.roomNumber || null
      })
      .select(TT_SELECT)
      .single();

    if (error) {
      logger.error('Failed to create timetable entry', { error: error.message });
      throw new DatabaseError('Failed to create timetable entry');
    }

    const formatted = this._format(entry);
    cache.set(`${ENTRY_PREFIX}:${entry.id}`, formatted, TTL);
    cache.delPattern(`${CLASS_TT_PREFIX}:${data.classId}:*`);
    if (data.teacherId) cache.delPattern(`${TEACHER_TT_PREFIX}:${data.teacherId}:*`);

    logger.info('Timetable entry created', { id: entry.id });
    return formatted;
  }

  async getClassTimetable(classId, sectionId, { dayOfWeek } = {}) {
    const cacheKey = `${CLASS_TT_PREFIX}:${classId}:${sectionId}:${dayOfWeek || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('timetable')
      .select(TT_SELECT)
      .eq('class_id', classId)
      .eq('section_id', sectionId)
      .order('day_of_week')
      .order('period_number');

    if (dayOfWeek) query = query.eq('day_of_week', dayOfWeek);

    const { data, error } = await query;
    if (error) throw new DatabaseError('Failed to fetch timetable');

    const result = (data || []).map(e => this._format(e));
    cache.set(cacheKey, result, TTL);
    return result;
  }

  async getTeacherTimetable(teacherId, { dayOfWeek } = {}) {
    const cacheKey = `${TEACHER_TT_PREFIX}:${teacherId}:${dayOfWeek || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('timetable')
      .select(TT_SELECT)
      .eq('teacher_id', teacherId)
      .order('day_of_week')
      .order('period_number');

    if (dayOfWeek) query = query.eq('day_of_week', dayOfWeek);

    const { data, error } = await query;
    if (error) throw new DatabaseError('Failed to fetch timetable');

    const result = (data || []).map(e => this._format(e));
    cache.set(cacheKey, result, TTL);
    return result;
  }

  async updateTimetableEntry(id, data) {
    const existing = await this._getById(id);

    const updates = {};
    if (data.subject !== undefined) updates.subject = data.subject;
    if (data.teacherId !== undefined) updates.teacher_id = data.teacherId;
    if (data.dayOfWeek !== undefined) updates.day_of_week = data.dayOfWeek;
    if (data.startTime !== undefined) updates.start_time = data.startTime;
    if (data.endTime !== undefined) updates.end_time = data.endTime;
    if (data.roomNumber !== undefined) updates.room_number = data.roomNumber;

    const { data: updated, error } = await supabase
      .from('timetable')
      .update(updates)
      .eq('id', id)
      .select(TT_SELECT)
      .single();

    if (error) throw new DatabaseError('Failed to update timetable entry');

    const formatted = this._format(updated);
    cache.del(`${ENTRY_PREFIX}:${id}`);
    cache.delPattern(`${CLASS_TT_PREFIX}:${existing.classId}:*`);
    if (existing.teacherId) cache.delPattern(`${TEACHER_TT_PREFIX}:${existing.teacherId}:*`);

    logger.info('Timetable entry updated', { id });
    return formatted;
  }

  async deleteTimetableEntry(id) {
    const existing = await this._getById(id);

    const { error } = await supabase.from('timetable').delete().eq('id', id);
    if (error) throw new DatabaseError('Failed to delete timetable entry');

    cache.del(`${ENTRY_PREFIX}:${id}`);
    cache.delPattern(`${CLASS_TT_PREFIX}:${existing.classId}:*`);
    if (existing.teacherId) cache.delPattern(`${TEACHER_TT_PREFIX}:${existing.teacherId}:*`);

    logger.info('Timetable entry deleted', { id });
  }

  async _getById(id) {
    const cacheKey = `${ENTRY_PREFIX}:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('timetable')
      .select(TT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Timetable entry');
    return this._format(data);
  }

  _format(e) {
    return {
      id: e.id,
      classId: e.class_id,
      className: e.classes?.name || null,
      sectionId: e.section_id,
      sectionName: e.sections?.name || null,
      subject: e.subject,
      teacherId: e.teacher_id || null,
      teacherName: e.users ? `${e.users.first_name} ${e.users.last_name}` : null,
      dayOfWeek: e.day_of_week,
      periodNumber: e.period_number,
      startTime: e.start_time,
      endTime: e.end_time,
      roomNumber: e.room_number || null,
      createdAt: e.created_at,
      updatedAt: e.updated_at || null
    };
  }
}

module.exports = new TimetableService();
