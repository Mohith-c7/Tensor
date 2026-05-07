/**
 * Joi Validation Schemas
 * Defines schemas for all API request bodies, query params, and route params
 */

const Joi = require('joi');

// ─── Reusable field definitions ───────────────────────────────────────────────

const id = Joi.number().integer().positive();
const email = Joi.string().email().max(255).lowercase().trim();
const phone = Joi.string().pattern(/^\+?[\d\s\-().]{7,20}$/).trim();
const academicYear = Joi.string().pattern(/^\d{4}-\d{4}$/).example('2024-2025');
const dateStr = Joi.string().isoDate();
const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().min(6).max(128).required()
});

const forgotPasswordSchema = Joi.object({
  email: email.required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// ─── Students ─────────────────────────────────────────────────────────────────

const createStudentSchema = Joi.object({
  admissionNo: Joi.string().alphanum().max(50).required(),
  firstName: Joi.string().max(100).trim().required(),
  lastName: Joi.string().max(100).trim().required(),
  dateOfBirth: dateStr.required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  email: email.optional(),
  phone: phone.optional(),
  address: Joi.string().max(500).trim().optional(),
  classId: id.required(),
  sectionId: id.required(),
  admissionDate: dateStr.required(),
  parentName: Joi.string().max(200).trim().optional(),
  parentPhone: phone.optional(),
  parentEmail: email.optional()
});

const updateStudentSchema = Joi.object({
  firstName: Joi.string().max(100).trim(),
  lastName: Joi.string().max(100).trim(),
  email: email,
  phone: phone,
  address: Joi.string().max(500).trim(),
  classId: id,
  sectionId: id,
  parentName: Joi.string().max(200).trim(),
  parentPhone: phone,
  parentEmail: email,
  isActive: Joi.boolean()
}).min(1); // At least one field required for update

const studentQuerySchema = Joi.object({
  ...pagination,
  classId: id.optional(),
  sectionId: id.optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).trim().optional()
});

// ─── Attendance ───────────────────────────────────────────────────────────────

const attendanceRecordSchema = Joi.object({
  studentId: id.required(),
  date: dateStr.required(),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
  remarks: Joi.string().max(500).trim().optional()
});

const markAttendanceSchema = Joi.object({
  records: Joi.array().items(attendanceRecordSchema).min(1).required()
});

const attendanceQuerySchema = Joi.object({
  startDate: dateStr.optional(),
  endDate: dateStr.optional(),
  ...pagination
});

const classAttendanceQuerySchema = Joi.object({
  classId: id.required(),
  sectionId: id.required(),
  date: dateStr.required()
});

// ─── Fee Structures ───────────────────────────────────────────────────────────

const feeStructureSchema = Joi.object({
  classId: id.required(),
  academicYear: academicYear.required(),
  tuitionFee: Joi.number().positive().precision(2).required(),
  transportFee: Joi.number().min(0).precision(2).default(0),
  activityFee: Joi.number().min(0).precision(2).default(0),
  otherFee: Joi.number().min(0).precision(2).default(0)
});

// Fee payment schema aligned with actual DB schema


const feeStructureQuerySchema = Joi.object({
  classId: id.optional(),
  academicYear: academicYear.optional()
});

// ─── Fee Payments ─────────────────────────────────────────────────────────────

const feePaymentSchema = Joi.object({
  studentId: id.required(),
  academicYear: academicYear.required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentDate: dateStr.required(),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'cheque', 'online').required(),
  transactionId: Joi.string().max(100).trim().allow('').optional(),
  remarks: Joi.string().max(500).trim().allow('').optional()
});

const createExamSchema = Joi.object({
  name: Joi.string().max(200).trim().required(),
  examType: Joi.string()
    .valid('unit_test', 'mid_term', 'final', 'practical').required(),
  classId: id.required(),
  subject: Joi.string().max(100).trim().required(),
  maxMarks: Joi.number().integer().positive().required(),
  passingMarks: Joi.number().integer().positive().required(),
  examDate: dateStr.required()
});

const marksEntrySchema = Joi.object({
  studentId: id.required(),
  marksObtained: Joi.number().min(0).precision(2).required(),
  isAbsent: Joi.boolean().default(false),
  remarks: Joi.string().max(500).trim().optional()
});

const enterMarksSchema = Joi.object({
  marks: Joi.array().items(marksEntrySchema).min(1).required()
});

const updateMarksSchema = Joi.object({
  marksObtained: Joi.number().min(0).precision(2).required(),
  isAbsent: Joi.boolean().optional(),
  remarks: Joi.string().max(500).trim().optional()
});

const examQuerySchema = Joi.object({
  examType: Joi.string()
    .valid('unit_test', 'mid_term', 'final', 'practical').optional(),
  ...pagination
});

// ─── Timetable ────────────────────────────────────────────────────────────────

const createTimetableSchema = Joi.object({
  classId: id.required(),
  sectionId: id.required(),
  dayOfWeek: Joi.string()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday').required(),
  periodNumber: Joi.number().integer().min(1).max(12).required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  subject: Joi.string().max(100).trim().required(),
  teacherId: id.optional(),
  roomNumber: Joi.string().max(50).trim().optional()
});

const updateTimetableSchema = Joi.object({
  subject: Joi.string().max(100).trim(),
  teacherId: id,
  roomNumber: Joi.string().max(50).trim(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/)
}).min(1);

const timetableQuerySchema = Joi.object({
  classId: id.required(),
  sectionId: id.required(),
  dayOfWeek: Joi.string()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday').optional()
});

const teacherTimetableQuerySchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday').optional()
});

// ─── Route params ─────────────────────────────────────────────────────────────

const idParamSchema = Joi.object({
  id: id.required()
});

const studentIdParamSchema = Joi.object({
  studentId: id.required()
});

const examIdParamSchema = Joi.object({
  examId: id.required()
});

const markIdParamSchema = Joi.object({
  markId: id.required()
});

const teacherIdParamSchema = Joi.object({
  teacherId: id.required()
});

module.exports = {
  // Auth
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  // Students
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  // Attendance
  markAttendanceSchema,
  attendanceQuerySchema,
  classAttendanceQuerySchema,
  // Fees
  feeStructureSchema,
  feeStructureQuerySchema,
  feePaymentSchema,
  // Exams
  createExamSchema,
  enterMarksSchema,
  updateMarksSchema,
  examQuerySchema,
  // Timetable
  createTimetableSchema,
  updateTimetableSchema,
  timetableQuerySchema,
  teacherTimetableQuerySchema,
  // Params
  idParamSchema,
  studentIdParamSchema,
  examIdParamSchema,
  markIdParamSchema,
  teacherIdParamSchema
};
