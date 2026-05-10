/**
 * Exam Service
 * Exam management, marks entry, and result statistics
 * Schema: exams(id, name, exam_type, class_id, subject, max_marks, passing_marks, exam_date)
 *         marks(id, exam_id, student_id, marks_obtained, is_absent, remarks, entered_by)
 * Requirements: 15.3
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const audit = require('../utils/audit');
const { NotFoundError, DatabaseError, ConflictError, ValidationError } = require('../utils/errors');
const config = require('../config/index');

const EXAM_SELECT = '*, classes(name)';

class ExamService {
  /**
   * Create a new exam
   * @param {Object} data - { name, examType, classId, subject, examDate, maxMarks, passingMarks }
   * @param {number} createdBy - user ID
   */
  async createExam(data, createdBy) {
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        name: data.name,
        exam_type: data.examType,
        class_id: data.classId,
        subject: data.subject,
        exam_date: data.examDate,
        max_marks: data.maxMarks,
        passing_marks: data.passingMarks
      })
      .select(EXAM_SELECT)
      .single();

    if (error) {
      logger.error('Failed to create exam', { error: error.message });
      throw new DatabaseError('Failed to create exam');
    }

    logger.info('Exam created', { examId: exam.id, name: exam.name });
    return this._fmtExam(exam);
  }

  /**
   * Enter marks for multiple students in bulk
   * @param {number} examId
   * @param {Array} marksData - [{ studentId, marksObtained, isAbsent, remarks }]
   * @param {number} enteredBy - user ID
   */
  async enterMarks(examId, marksData, enteredBy) {
    const exam = await this._getExamById(examId);

    if (!marksData || marksData.length === 0) {
      throw new ValidationError('At least one marks record is required');
    }

    const studentIds = marksData.map(m => m.studentId);
    const { data: existing } = await supabase
      .from('marks')
      .select('student_id')
      .eq('exam_id', examId)
      .in('student_id', studentIds);

    if (existing && existing.length > 0) {
      throw new ConflictError(`Marks already entered for students: ${existing.map(e => e.student_id).join(', ')}`);
    }

    const rows = marksData.map(m => ({
      exam_id: examId,
      student_id: m.studentId,
      marks_obtained: m.marksObtained,
      is_absent: m.isAbsent || false,
      remarks: m.remarks || null,
      entered_by: enteredBy
    }));

    const { data, error } = await supabase
      .from('marks')
      .insert(rows)
      .select('id, student_id, marks_obtained, is_absent');

    if (error) {
      logger.error('Failed to enter marks', { examId, error: error.message });
      throw new DatabaseError('Failed to enter marks');
    }

    logger.info('Marks entered', { examId, count: data.length, enteredBy });
    return { examId, examName: exam.name, totalEntered: data.length, absent: data.filter(r => r.is_absent).length };
  }

  /**
   * Update a single mark entry with audit log
   * @param {number} markId
   * @param {Object} data - { marksObtained, isAbsent, remarks }
   * @param {number} updatedBy - user ID
   */
  async updateMarks(markId, data, updatedBy) {
    const { data: existing, error: fetchErr } = await supabase
      .from('marks').select('*').eq('id', markId).single();

    if (fetchErr || !existing) throw new NotFoundError('Mark record');

    const updates = {};
    if (data.marksObtained !== undefined) updates.marks_obtained = data.marksObtained;
    if (data.isAbsent !== undefined) updates.is_absent = data.isAbsent;
    if (data.remarks !== undefined) updates.remarks = data.remarks;

    const { data: updated, error } = await supabase
      .from('marks').update(updates).eq('id', markId).select('*').single();

    if (error) throw new DatabaseError('Failed to update marks');

    await audit.log({
      userId: updatedBy,
      action: 'UPDATE',
      resourceType: 'marks',
      resourceId: String(markId),
      changes: { before: existing, after: updated }
    });

    logger.info('Marks updated', { markId, updatedBy });
    return this._fmtMark(updated);
  }

  /**
   * Get all exam results for a student
   */
  async getStudentResults(studentId, { examType, classId, page = 1, limit } = {}) {
    // Validate student exists
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .single();

    if (sErr || !student) throw new NotFoundError('Student');

    const pageSize = Math.min(limit || config.defaultPageSize, config.maxPageSize);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('marks')
      .select(`
        id, marks_obtained, is_absent, remarks, created_at,
        exams(id, name, exam_type, subject, exam_date, max_marks, passing_marks, class_id, classes(name))
      `, { count: 'exact' })
      .eq('student_id', studentId);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new DatabaseError('Failed to fetch student results');

    return {
      data: (data || []).map(r => ({
        id: r.id,
        marksObtained: r.marks_obtained,
        isAbsent: r.is_absent,
        remarks: r.remarks,
        percentage: r.exams && !r.is_absent ? parseFloat((r.marks_obtained / r.exams.max_marks * 100).toFixed(2)) : null,
        passed: r.exams && !r.is_absent ? r.marks_obtained >= r.exams.passing_marks : false,
        exam: r.exams ? this._fmtExam(r.exams) : null,
        createdAt: r.created_at
      })),
      pagination: { page, limit: pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    };
  }

  /**
   * Get class results for an exam with statistics
   */
  async getClassResults(examId) {
    const exam = await this._getExamById(examId);

    const { data: marks, error } = await supabase
      .from('marks')
      .select('id, marks_obtained, is_absent, remarks, students(id, admission_no, first_name, last_name)')
      .eq('exam_id', examId)
      .order('marks_obtained', { ascending: false });

    if (error) throw new DatabaseError('Failed to fetch class results');

    const stats = this._calcStats(marks || [], exam.maxMarks, exam.passingMarks);

    return {
      exam,
      statistics: stats,
      results: (marks || []).map(m => ({
        id: m.id,
        marksObtained: m.marks_obtained,
        isAbsent: m.is_absent,
        remarks: m.remarks,
        percentage: m.is_absent ? null : parseFloat((m.marks_obtained / exam.maxMarks * 100).toFixed(2)),
        passed: m.is_absent ? false : m.marks_obtained >= exam.passingMarks,
        student: m.students ? {
          id: m.students.id,
          admissionNo: m.students.admission_no,
          fullName: `${m.students.first_name} ${m.students.last_name}`
        } : null
      }))
    };
  }

  async _getExamById(examId) {
    const { data: exam, error } = await supabase
      .from('exams').select(EXAM_SELECT).eq('id', examId).single();
    if (error || !exam) throw new NotFoundError('Exam');
    return this._fmtExam(exam);
  }

  _calcStats(marks, maxMarks, passingMarks) {
    const present = marks.filter(m => !m.is_absent);
    const scores = present.map(m => parseFloat(m.marks_obtained));
    const passed = present.filter(m => m.marks_obtained >= passingMarks);
    return {
      totalStudents: marks.length,
      appeared: present.length,
      absent: marks.length - present.length,
      passed: passed.length,
      failed: present.length - passed.length,
      passRate: present.length > 0 ? parseFloat((passed.length / present.length * 100).toFixed(2)) : 0,
      average: scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0,
      highest: scores.length > 0 ? Math.max(...scores) : 0,
      lowest: scores.length > 0 ? Math.min(...scores) : 0
    };
  }

  _fmtExam(e) {
    return {
      id: e.id, name: e.name, examType: e.exam_type,
      classId: e.class_id, className: e.classes?.name || null,
      subject: e.subject, examDate: e.exam_date,
      maxMarks: parseFloat(e.max_marks), passingMarks: parseFloat(e.passing_marks),
      createdAt: e.created_at
    };
  }

  _fmtMark(m) {
    return {
      id: m.id, examId: m.exam_id, studentId: m.student_id,
      marksObtained: m.marks_obtained, isAbsent: m.is_absent,
      remarks: m.remarks, enteredBy: m.entered_by,
      createdAt: m.created_at, updatedAt: m.updated_at
    };
  }
}

module.exports = new ExamService();
