/**
 * Attendance Service
 * Bulk attendance recording, retrieval, and statistics
 * Requirements: 8.5
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const { DatabaseError, ValidationError } = require('../utils/errors');

class AttendanceService {
  /**
   * Mark attendance for multiple students in bulk
   * Schema: attendance(id, student_id, date, status, remarks, marked_by)
   * @param {Object} data - { records: [{studentId, date, status, remarks}] }
   * @param {number} markedBy - user ID
   */
  async markAttendance({ records }, markedBy) {
    if (!records || records.length === 0) {
      throw new ValidationError('At least one attendance record is required');
    }

    const rows = records.map(r => ({
      student_id: r.studentId,
      date: r.date,
      status: r.status,
      remarks: r.remarks || null,
      marked_by: markedBy
    }));

    const { data, error } = await supabase
      .from('attendance')
      .insert(rows)
      .select('id, student_id, status, date');

    if (error) {
      logger.error('Failed to mark attendance', { error: error.message });
      throw new DatabaseError('Failed to mark attendance');
    }

    const summary = {
      total: data.length,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      late: data.filter(r => r.status === 'late').length,
      excused: data.filter(r => r.status === 'excused').length
    };

    logger.info('Attendance marked', { ...summary, markedBy });
    return summary;
  }

  /**
   * Get attendance records for a student with optional date range
   */
  async getStudentAttendance(studentId, { startDate, endDate, page = 1, limit = 30 } = {}) {
    let query = supabase
      .from('attendance')
      .select('id, date, status, remarks, marked_by, created_at', { count: 'exact' })
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const pageSize = Math.min(limit, 100);
    const offset = (page - 1) * pageSize;
    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new DatabaseError('Failed to fetch attendance records');

    return {
      data: (data || []).map(r => this._fmt(r)),
      pagination: { page, limit: pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    };
  }

  /**
   * Get attendance statistics for a student
   */
  async getAttendanceStats(studentId, { startDate, endDate } = {}) {
    let query = supabase.from('attendance').select('status').eq('student_id', studentId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw new DatabaseError('Failed to fetch attendance statistics');

    const records = data || [];
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;

    return {
      studentId, total, present, absent, late, excused,
      attendancePercentage: total > 0 ? parseFloat(((present + late) / total * 100).toFixed(2)) : 0,
      period: { startDate: startDate || null, endDate: endDate || null }
    };
  }

  /**
   * Get attendance for a class/section — joins through students table.
   * Always returns all active students; attendance status defaults to 'present' if not yet marked.
   */
  async getClassAttendance(classId, sectionId, { date, startDate, endDate } = {}) {
    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('id, admission_no, first_name, last_name')
      .eq('class_id', classId)
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .order('first_name');

    if (sErr) throw new DatabaseError('Failed to fetch class students');
    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.id);

    let query = supabase
      .from('attendance')
      .select('id, student_id, date, status, remarks, marked_by, created_at')
      .in('student_id', studentIds);

    if (date) query = query.eq('date', date);
    else {
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
    }

    const { data: records, error } = await query;
    if (error) throw new DatabaseError('Failed to fetch class attendance');

    // Build a map of existing records keyed by student_id
    const recordMap = {};
    for (const r of (records || [])) {
      recordMap[r.student_id] = r;
    }

    // Return one row per student — use existing record if present, else default to 'present'
    return students.map(s => {
      const r = recordMap[s.id];
      return {
        id: r?.id ?? null,
        studentId: s.id,
        studentName: `${s.first_name} ${s.last_name}`,
        admissionNo: s.admission_no,
        date: r?.date ?? (date || null),
        status: r?.status ?? 'present',
        remarks: r?.remarks ?? null,
        markedBy: r?.marked_by ?? null,
        createdAt: r?.created_at ?? null,
      };
    });
  }

  _fmt(r) {
    return { id: r.id, date: r.date, status: r.status, remarks: r.remarks, markedBy: r.marked_by, createdAt: r.created_at };
  }
}

module.exports = new AttendanceService();
