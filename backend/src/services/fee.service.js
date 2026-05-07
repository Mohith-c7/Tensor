/**
 * Fee Service
 * Fee structure management, payment recording, and reporting
 * Schema: fee_structures(id, class_id, academic_year, tuition_fee, transport_fee, activity_fee, other_fee, total_fee)
 *         fee_payments(id, student_id, academic_year, amount, payment_date, payment_method, transaction_id, remarks, received_by)
 * Requirements: 9.3, 16.1
 */

const { supabase } = require('../config/database');
const logger = require('../config/logger');
const cache = require('../utils/cache');
const { NotFoundError, DatabaseError, ConflictError } = require('../utils/errors');
const config = require('../config/index');

const FEE_STRUCTURE_PREFIX = 'fee:structure';
const FEE_TTL = config.cacheFeeTtl; // 24 hours

class FeeService {
  /**
   * Create a fee structure for a class/year
   * @param {Object} data - { classId, academicYear, tuitionFee, transportFee, activityFee, otherFee }
   */
  async createFeeStructure(data) {
    const { data: existing } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('class_id', data.classId)
      .eq('academic_year', data.academicYear)
      .single();

    if (existing) {
      throw new ConflictError(`Fee structure for class ${data.classId}, year ${data.academicYear} already exists`);
    }

    const tuitionFee = parseFloat(data.tuitionFee) || 0;
    const transportFee = parseFloat(data.transportFee) || 0;
    const activityFee = parseFloat(data.activityFee) || 0;
    const otherFee = parseFloat(data.otherFee) || 0;
    const totalFee = tuitionFee + transportFee + activityFee + otherFee;

    const { data: structure, error } = await supabase
      .from('fee_structures')
      .insert({
        class_id: data.classId,
        academic_year: data.academicYear,
        tuition_fee: tuitionFee,
        transport_fee: transportFee,
        activity_fee: activityFee,
        other_fee: otherFee,
        total_fee: totalFee
      })
      .select('*, classes(name)')
      .single();

    if (error) {
      logger.error('Failed to create fee structure', { error: error.message });
      throw new DatabaseError('Failed to create fee structure');
    }

    const formatted = this._fmtStructure(structure);
    cache.set(`${FEE_STRUCTURE_PREFIX}:${structure.id}`, formatted, FEE_TTL);
    logger.info('Fee structure created', { id: structure.id });
    return formatted;
  }

  /**
   * Get fee structures with optional filters
   */
  async getFeeStructures({ classId, academicYear, page = 1, limit } = {}) {
    const pageSize = Math.min(limit || config.defaultPageSize, config.maxPageSize);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('fee_structures')
      .select('*, classes(name)', { count: 'exact' });

    if (classId) query = query.eq('class_id', classId);
    if (academicYear) query = query.eq('academic_year', academicYear);

    const { data, error, count } = await query
      .order('academic_year', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new DatabaseError('Failed to fetch fee structures');

    return {
      data: (data || []).map(s => this._fmtStructure(s)),
      pagination: { page, limit: pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    };
  }

  /**
   * Record a fee payment for a student
   * @param {Object} data - { studentId, academicYear, amount, paymentDate, paymentMethod, transactionId, remarks }
   * @param {number} receivedBy - user ID
   */
  async recordPayment(data, receivedBy) {
    // Verify student exists
    const { data: student, error: sErr } = await supabase
      .from('students').select('id').eq('id', data.studentId).single();
    if (sErr || !student) throw new NotFoundError('Student');

    const { data: payment, error } = await supabase
      .from('fee_payments')
      .insert({
        student_id: data.studentId,
        academic_year: data.academicYear,
        amount: data.amount,
        payment_date: data.paymentDate,
        payment_method: data.paymentMethod,
        transaction_id: data.transactionId || null,
        remarks: data.remarks || null,
        received_by: receivedBy
      })
      .select('id, student_id, academic_year, amount, payment_date, payment_method, transaction_id, remarks, received_by, created_at')
      .single();

    if (error) {
      logger.error('Failed to record payment', { error: error.message });
      throw new DatabaseError('Failed to record payment');
    }

    logger.info('Fee payment recorded', { paymentId: payment.id, studentId: data.studentId });
    return this._fmtPayment(payment);
  }

  /**
   * Get fee status for a student
   */
  async getStudentFeeStatus(studentId, { academicYear } = {}) {
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('id, class_id, first_name, last_name, admission_no')
      .eq('id', studentId)
      .single();

    if (sErr || !student) throw new NotFoundError('Student');

    let structQuery = supabase.from('fee_structures').select('*').eq('class_id', student.class_id);
    if (academicYear) structQuery = structQuery.eq('academic_year', academicYear);
    const { data: structures } = await structQuery;

    let payQuery = supabase.from('fee_payments').select('*').eq('student_id', studentId);
    if (academicYear) payQuery = payQuery.eq('academic_year', academicYear);
    const { data: payments } = await payQuery;

    const totalDue = (structures || []).reduce((s, r) => s + parseFloat(r.total_fee), 0);
    const totalPaid = (payments || []).reduce((s, r) => s + parseFloat(r.amount), 0);

    return {
      student: { id: student.id, admissionNo: student.admission_no, fullName: `${student.first_name} ${student.last_name}` },
      summary: {
        totalDue: parseFloat(totalDue.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        balance: parseFloat((totalDue - totalPaid).toFixed(2)),
        isPaid: totalPaid >= totalDue
      },
      structures: (structures || []).map(s => this._fmtStructure(s)),
      payments: (payments || []).map(p => this._fmtPayment(p))
    };
  }

  /**
   * Get pending fees report
   */
  async getPendingFeesReport({ classId, academicYear, page = 1, limit } = {}) {
    const pageSize = Math.min(limit || config.defaultPageSize, config.maxPageSize);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('students')
      .select('id, admission_no, first_name, last_name, class_id, classes(name)', { count: 'exact' })
      .eq('is_active', true);

    if (classId) query = query.eq('class_id', classId);

    const { data: students, error, count } = await query.order('last_name').range(offset, offset + pageSize - 1);
    if (error) throw new DatabaseError('Failed to fetch pending fees report');

    const report = await Promise.all((students || []).map(async (student) => {
      let structQuery = supabase.from('fee_structures').select('total_fee').eq('class_id', student.class_id);
      if (academicYear) structQuery = structQuery.eq('academic_year', academicYear);
      const { data: structures } = await structQuery;

      let payQuery = supabase.from('fee_payments').select('amount').eq('student_id', student.id);
      if (academicYear) payQuery = payQuery.eq('academic_year', academicYear);
      const { data: payments } = await payQuery;

      const totalDue = (structures || []).reduce((s, r) => s + parseFloat(r.total_fee), 0);
      const totalPaid = (payments || []).reduce((s, r) => s + parseFloat(r.amount), 0);
      const balance = totalDue - totalPaid;

      return {
        studentId: student.id,
        admissionNo: student.admission_no,
        fullName: `${student.first_name} ${student.last_name}`,
        className: student.classes?.name || null,
        totalDue: parseFloat(totalDue.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        balance: parseFloat(balance.toFixed(2))
      };
    }));

    return {
      data: report.filter(r => r.balance > 0),
      pagination: { page, limit: pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) }
    };
  }

  /**
   * Get class fees summary with all students
   */
  async getClassFeesSummary(classId, { academicYear } = {}) {
    // Get fee structure for the class
    let structQuery = supabase
      .from('fee_structures')
      .select('*')
      .eq('class_id', classId);
    
    if (academicYear) structQuery = structQuery.eq('academic_year', academicYear);
    
    const { data: structures } = await structQuery.limit(1);
    const feeStructure = structures && structures.length > 0 ? this._fmtStructure(structures[0]) : null;

    // Get all active students in the class
    const { data: students, error } = await supabase
      .from('students')
      .select('id, admission_no, first_name, last_name')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('admission_no');

    if (error) throw new DatabaseError('Failed to fetch students');

    // Get payment details for each student
    const studentDetails = await Promise.all((students || []).map(async (student) => {
      let payQuery = supabase
        .from('fee_payments')
        .select('amount')
        .eq('student_id', student.id);
      
      if (academicYear) payQuery = payQuery.eq('academic_year', academicYear);
      
      const { data: payments } = await payQuery;

      const totalFee = feeStructure ? feeStructure.totalFee : 0;
      const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const outstandingBalance = totalFee - totalPaid;

      let paymentStatus = 'unpaid';
      if (totalPaid >= totalFee) paymentStatus = 'paid';
      else if (totalPaid > 0) paymentStatus = 'partial';

      return {
        studentId: student.id,
        admissionNo: student.admission_no,
        fullName: `${student.first_name} ${student.last_name}`,
        totalFee: parseFloat(totalFee.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        outstandingBalance: parseFloat(outstandingBalance.toFixed(2)),
        paymentStatus
      };
    }));

    return {
      feeStructure,
      students: studentDetails
    };
  }

  _fmtStructure(s) {
    return {
      id: s.id,
      classId: s.class_id,
      className: s.classes?.name || null,
      academicYear: s.academic_year,
      tuitionFee: parseFloat(s.tuition_fee),
      transportFee: parseFloat(s.transport_fee || 0),
      activityFee: parseFloat(s.activity_fee || 0),
      otherFee: parseFloat(s.other_fee || 0),
      totalFee: parseFloat(s.total_fee),
      createdAt: s.created_at
    };
  }

  _fmtPayment(p) {
    return {
      id: p.id,
      studentId: p.student_id,
      academicYear: p.academic_year,
      amount: parseFloat(p.amount),
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      remarks: p.remarks,
      receivedBy: p.received_by,
      createdAt: p.created_at
    };
  }
}

module.exports = new FeeService();
