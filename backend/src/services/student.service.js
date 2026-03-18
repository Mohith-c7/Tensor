/**
 * Student Service
 * CRUD operations for students with caching, pagination, and filtering
 * Requirements: 8.1, 8.2, 8.3, 9.1, 9.4, 16.2
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const cache = require('../utils/cache');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const config = require('../config/index');

const CACHE_PREFIX = 'student';
const CACHE_LIST_PREFIX = 'students:list';

const STUDENT_SELECT = `
  id, admission_no, first_name, last_name, date_of_birth, gender,
  email, phone, address, class_id, section_id, admission_date,
  parent_name, parent_phone, parent_email, is_active, created_at, updated_at,
  classes(name), sections(name)
`;

class StudentService {
  /**
   * Create a new student
   * @param {Object} data - student fields (camelCase from validated request)
   * @returns {Promise<Object>} created student
   */
  async createStudent(data) {
    // Check for duplicate admission number
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', data.admissionNo)
      .single();

    if (existing) {
      throw new ConflictError(`Student with admission number ${data.admissionNo} already exists`);
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        admission_no: data.admissionNo,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        class_id: data.classId,
        section_id: data.sectionId,
        admission_date: data.admissionDate,
        parent_name: data.parentName || null,
        parent_phone: data.parentPhone || null,
        parent_email: data.parentEmail || null
      })
      .select(STUDENT_SELECT)
      .single();

    if (error) {
      logger.error('Failed to create student', { error: error.message });
      throw new DatabaseError('Failed to create student');
    }

    await cache.delPattern(`${CACHE_LIST_PREFIX}:*`);
    logger.info('Student created', { studentId: student.id, admissionNo: student.admission_no });
    return this._format(student);
  }

  /**
   * Get a single student by ID (with cache)
   * @param {number} id
   * @returns {Promise<Object>} student
   */
  async getStudentById(id) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data: student, error } = await supabase
      .from('students')
      .select(STUDENT_SELECT)
      .eq('id', id)
      .single();

    if (error || !student) throw new NotFoundError('Student');

    const formatted = this._format(student);
    cache.set(cacheKey, formatted);
    return formatted;
  }

  /**
   * Get paginated list of students with optional filters
   * @param {Object} options - { page, limit, classId, sectionId, search, isActive }
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getStudents({ page = 1, limit, classId, sectionId, search, isActive } = {}) {
    const pageSize = Math.min(limit || config.defaultPageSize, config.maxPageSize);
    const offset = (page - 1) * pageSize;

    const cacheKey = `${CACHE_LIST_PREFIX}:${JSON.stringify({ page, pageSize, classId, sectionId, search, isActive })}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('students')
      .select(STUDENT_SELECT, { count: 'exact' });

    if (classId) query = query.eq('class_id', classId);
    if (sectionId) query = query.eq('section_id', sectionId);
    if (isActive !== undefined) query = query.eq('is_active', isActive);
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_no.ilike.%${search}%`
      );
    }

    const { data: students, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      logger.error('Failed to fetch students', { error: error.message });
      throw new DatabaseError('Failed to fetch students');
    }

    const result = {
      data: (students || []).map(s => this._format(s)),
      pagination: {
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    };

    cache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Update a student by ID
   * @param {number} id
   * @param {Object} data - fields to update (camelCase)
   * @returns {Promise<Object>} updated student
   */
  async updateStudent(id, data) {
    await this.getStudentById(id); // verify exists

    const updates = {};
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.address !== undefined) updates.address = data.address;
    if (data.classId !== undefined) updates.class_id = data.classId;
    if (data.sectionId !== undefined) updates.section_id = data.sectionId;
    if (data.parentName !== undefined) updates.parent_name = data.parentName;
    if (data.parentPhone !== undefined) updates.parent_phone = data.parentPhone;
    if (data.parentEmail !== undefined) updates.parent_email = data.parentEmail;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    const { data: student, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select(STUDENT_SELECT)
      .single();

    if (error) {
      logger.error('Failed to update student', { studentId: id, error: error.message });
      throw new DatabaseError('Failed to update student');
    }

    cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_LIST_PREFIX}:*`);
    logger.info('Student updated', { studentId: id });
    return this._format(student);
  }

  /**
   * Delete a student and all related records (cascaded by FK)
   * @param {number} id
   * @returns {Promise<void>}
   */
  async deleteStudent(id) {
    await this.getStudentById(id); // verify exists

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete student', { studentId: id, error: error.message });
      throw new DatabaseError('Failed to delete student');
    }

    cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_LIST_PREFIX}:*`);
    logger.info('Student deleted', { studentId: id });
  }

  /** @private */
  _format(s) {
    return {
      id: s.id,
      admissionNo: s.admission_no,
      firstName: s.first_name,
      lastName: s.last_name,
      fullName: `${s.first_name} ${s.last_name}`,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      email: s.email || null,
      phone: s.phone || null,
      address: s.address || null,
      classId: s.class_id,
      className: s.classes?.name || null,
      sectionId: s.section_id,
      sectionName: s.sections?.name || null,
      parentName: s.parent_name || null,
      parentPhone: s.parent_phone || null,
      parentEmail: s.parent_email || null,
      admissionDate: s.admission_date,
      isActive: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at || null
    };
  }
}

module.exports = new StudentService();
