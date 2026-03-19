import type {
  Student, AttendanceRecord, FeeStructure, FeePayment,
  StudentFeeStatus, Exam, Mark, ExamStatistics, TimetableEntry,
} from '../../types/api';

/** Build a minimal JWT for testing (not cryptographically valid). */
function makeJwt(payload: object): string {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
}

const now = Math.floor(Date.now() / 1000);

export const fixtures = {
  // ── Tokens ──────────────────────────────────────────────────────────
  adminToken: makeJwt({ userId: 1, role: 'admin', email: 'admin@test.com', exp: now + 3600, iat: now }),
  teacherToken: makeJwt({ userId: 42, role: 'teacher', email: 'teacher@test.com', exp: now + 3600, iat: now }),

  // ── Students ────────────────────────────────────────────────────────
  students: [
    {
      id: 1, admissionNo: 'ADM001', firstName: 'Alice', lastName: 'Smith',
      dateOfBirth: new Date('2010-05-15').toISOString(), gender: 'female' as const,
      email: 'alice@test.com', phone: '555-0001', address: '1 Main St',
      classId: 1, sectionId: 1, className: 'Class 10', sectionName: 'A',
      admissionDate: new Date('2020-06-01').toISOString(), parentName: 'Bob Smith',
      parentPhone: '555-0002', parentEmail: 'bob@test.com', isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 2, admissionNo: 'ADM002', firstName: 'Charlie', lastName: 'Brown',
      dateOfBirth: new Date('2010-08-20').toISOString(), gender: 'male' as const,
      classId: 1, sectionId: 1, className: 'Class 10', sectionName: 'A',
      admissionDate: new Date('2020-06-01').toISOString(), parentName: 'Diana Brown',
      parentPhone: '555-0003', isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ] as unknown as Student[],

  // ── Attendance ──────────────────────────────────────────────────────
  attendanceRecords: [
    { id: 1, studentId: 1, studentName: 'Alice Smith', admissionNo: 'ADM001', date: new Date().toISOString(), status: 'present' as const },
    { id: 2, studentId: 2, studentName: 'Charlie Brown', admissionNo: 'ADM002', date: new Date().toISOString(), status: 'absent' as const },
  ] as unknown as AttendanceRecord[],

  // ── Fee Structures ──────────────────────────────────────────────────
  feeStructures: [
    { id: 1, classId: 1, className: 'Class 10', academicYear: '2025-2026', tuitionFee: 50000, transportFee: 5000, activityFee: 2000, otherFee: 1000, totalFee: 58000 },
  ] as FeeStructure[],

  // ── Payments ────────────────────────────────────────────────────────
  payments: [
    { id: 1, studentId: 1, academicYear: '2025-2026', amount: 29000, paymentDate: new Date().toISOString(), paymentMethod: 'cash' as const },
  ] as unknown as FeePayment[],

  // ── Student Fee Status ───────────────────────────────────────────────
  studentFeeStatus: {
    feeStructure: { id: 1, classId: 1, className: 'Class 10', academicYear: '2025-2026', tuitionFee: 50000, transportFee: 5000, activityFee: 2000, otherFee: 1000, totalFee: 58000 },
    totalFee: 58000,
    totalPaid: 29000,
    outstandingBalance: 29000,
    payments: [
      { id: 1, studentId: 1, academicYear: '2025-2026', amount: 29000, paymentDate: new Date().toISOString(), paymentMethod: 'cash' as const },
    ],
  } as unknown as StudentFeeStatus,

  // ── Exams ────────────────────────────────────────────────────────────
  exams: [
    { id: 1, name: 'Math Final', examType: 'final' as const, classId: 1, className: 'Class 10', subject: 'Mathematics', maxMarks: 100, passingMarks: 40, examDate: new Date().toISOString() },
  ] as unknown as Exam[],

  // ── Marks ────────────────────────────────────────────────────────────
  marks: [
    { id: 1, examId: 1, studentId: 1, studentName: 'Alice Smith', admissionNo: 'ADM001', marksObtained: 85, isAbsent: false, grade: 'A' as const, isPassed: true },
    { id: 2, examId: 1, studentId: 2, studentName: 'Charlie Brown', admissionNo: 'ADM002', marksObtained: 35, isAbsent: false, grade: 'F' as const, isPassed: false },
  ] as Mark[],

  // ── Exam Statistics ──────────────────────────────────────────────────
  examStatistics: {
    average: 60, highest: 85, lowest: 35, passCount: 1, failCount: 1, passPercentage: 50,
    distribution: [
      { range: '0-20', count: 0 }, { range: '21-40', count: 1 },
      { range: '41-60', count: 0 }, { range: '61-80', count: 0 }, { range: '81-100', count: 1 },
    ],
  } as ExamStatistics,

  // ── Timetable ────────────────────────────────────────────────────────
  timetableEntries: [
    { id: 1, classId: 1, sectionId: 1, teacherId: 42, subject: 'Mathematics', dayOfWeek: 'monday' as const, periodNumber: 1, startTime: '08:00', endTime: '09:00', roomNumber: 'R101' },
    { id: 2, classId: 1, sectionId: 1, teacherId: 42, subject: 'Physics', dayOfWeek: 'tuesday' as const, periodNumber: 2, startTime: '09:00', endTime: '10:00', roomNumber: 'R102' },
  ] as TimetableEntry[],
};
