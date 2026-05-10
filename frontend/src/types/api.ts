// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: 'admin' | 'teacher';
    firstName: string;
    lastName: string;
  };
}

export interface DecodedToken {
  userId: number;
  role: 'admin' | 'teacher';
  email: string;
  iat: number;
  exp: number;
}

// ── Students ──────────────────────────────────────────────────────────────
export interface Student {
  id: number;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  classId: number;
  sectionId: number;
  className: string;
  sectionName: string;
  admissionDate: Date;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentRequest {
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  classId: number;
  sectionId: number;
  admissionDate: string; // ISO date
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  classId?: number;
  sectionId?: number;
  gender?: 'male' | 'female' | 'other';
  isActive?: boolean;
  search?: string;
  sortBy?: 'firstName' | 'admissionNo' | 'admissionDate';
  sortOrder?: 'asc' | 'desc';
}

// ── Attendance ────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  admissionNo: string;
  date: Date;
  status: AttendanceStatus;
  periodNumber: number;
  subject?: string;
  remarks?: string;
}

export interface MarkAttendanceRequest {
  records: Array<{
    studentId: number;
    date: string; // ISO date
    status: AttendanceStatus;
    periodNumber: number;
    subject?: string;
    remarks?: string;
  }>;
}

export interface AttendanceStats {
  student: {
    id: number;
    name: string;
    admissionNo: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  attendance: {
    percentage: number;
    present: number;
    totalScheduled: number;
    totalMarked: number;
    absent: number;
    late: number;
    excused: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'warning' | 'error' | 'info';
  }>;
}

// ── Fees ──────────────────────────────────────────────────────────────────
export interface FeeStructure {
  id: number;
  classId: number;
  className: string;
  academicYear: string;
  tuitionFee: number;
  transportFee: number;
  activityFee: number;
  otherFee: number;
  totalFee: number;
}

export interface FeePayment {
  id: number;
  studentId: number;
  academicYear: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'online';
  transactionId?: string;
  remarks?: string;
}

export interface StudentFeeStatus {
  student: {
    id: number;
    name: string;
    admissionNo: string;
  };
  academicYear: string;
  feeStructure: {
    totalFee: number;
    tuitionFee: number;
    transportFee: number;
    activityFee: number;
    otherFee: number;
  };
  payments: {
    totalPaid: number;
    count: number;
    lastPayment: FeePayment | null;
    history: FeePayment[];
  };
  status: {
    currentBalance: number;
    overdueAmount: number;
    nextInstallmentDue: number;
    isOverdue: boolean;
    paymentStatus: 'paid' | 'pending' | 'overdue';
  };
}

export interface PendingFeesReport {
  academicYear: string;
  totalPendingStudents: number;
  totalPendingAmount: number;
  pendingFees: Array<{
    studentId: number;
    studentName: string;
    admissionNo: string;
    className: string;
    totalFee: number;
    totalPaid: number;
    balance: number;
    academicYear: string;
  }>;
}

// ── Exams ─────────────────────────────────────────────────────────────────
export type ExamType = 'unit_test' | 'mid_term' | 'final' | 'practical';
export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Exam {
  id: number;
  name: string;
  examType: ExamType;
  classId: number;
  className: string;
  subject: string;
  maxMarks: number;
  passingMarks: number;
  examDate: Date;
}

export interface Mark {
  id: number;
  examId: number;
  studentId: number;
  studentName: string;
  admissionNo: string;
  marksObtained: number;
  isAbsent: boolean;
  remarks?: string;
  grade: LetterGrade;
  isPassed: boolean;
  percentage: number;
  rank?: number;
  enteredBy?: string;
}

export interface ExamStatistics {
  totalStudents: number;
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  distribution: Record<string, number>;
}

export interface StudentExamResults {
  studentId: number;
  resultsByType: Record<string, {
    examType: string;
    exams: Mark[];
    totalMarks: number;
    totalMaxMarks: number;
    averagePercentage: number;
    passedCount: number;
  }>;
  overallStats: {
    totalExams: number;
    totalMarks: number;
    totalMaxMarks: number;
    passedExams: number;
    failedExams: number;
    averagePercentage: number;
  };
}

export interface ExamResults {
  examId: number;
  exam: Exam;
  results: Mark[];
  statistics: ExamStatistics;
}

// ── Timetable ─────────────────────────────────────────────────────────────
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableEntry {
  id: number;
  classId: number;
  sectionId: number;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  subject: string;
  teacherId?: number;
  teacherName?: string;
  roomNumber?: string;
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ── API Response wrapper ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export class ApiError extends Error {
  status: number;
  message: string;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.message = message;
    this.code = code;
  }
}
