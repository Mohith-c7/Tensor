import { describe, it, expect } from 'vitest';
import {
  studentPersonalSchema,
  studentContactSchema,
  studentAcademicSchema,
  studentParentSchema,
  studentFullSchema,
} from '../../schemas/studentSchemas';
import { feeStructureSchema, paymentSchema } from '../../schemas/feeSchemas';
import { examSchema, marksEntrySchema } from '../../schemas/examSchemas';
import { timetableEntrySchema } from '../../schemas/timetableSchemas';

// ── studentPersonalSchema ─────────────────────────────────────────────────
describe('studentPersonalSchema', () => {
  const valid = {
    admissionNo: 'A001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '2010-05-15',
    gender: 'male' as const,
  };

  it('accepts valid input', () => {
    expect(studentPersonalSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid admissionNo', () => {
    const r = studentPersonalSchema.safeParse({ ...valid, admissionNo: 'a b c' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toMatch(/admissionNo|Admission/i);
  });

  it('rejects firstName too short', () => {
    const r = studentPersonalSchema.safeParse({ ...valid, firstName: 'J' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const r = studentPersonalSchema.safeParse({ ...valid, gender: 'unknown' });
    expect(r.success).toBe(false);
  });

  it('trims firstName and lastName', () => {
    const r = studentPersonalSchema.safeParse({ ...valid, firstName: '  John  ', lastName: '  Doe  ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.firstName).toBe('John');
      expect(r.data.lastName).toBe('Doe');
    }
  });
});

// ── studentContactSchema ──────────────────────────────────────────────────
describe('studentContactSchema', () => {
  it('accepts all optional fields absent', () => {
    expect(studentContactSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = studentContactSchema.safeParse({ email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('accepts valid email', () => {
    const r = studentContactSchema.safeParse({ email: 'test@example.com' });
    expect(r.success).toBe(true);
  });
});

// ── studentAcademicSchema ─────────────────────────────────────────────────
describe('studentAcademicSchema', () => {
  const valid = { classId: 1, sectionId: 2, admissionDate: '2020-01-01' };

  it('accepts valid input', () => {
    expect(studentAcademicSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects future admissionDate', () => {
    const r = studentAcademicSchema.safeParse({ ...valid, admissionDate: '2099-01-01' });
    expect(r.success).toBe(false);
  });

  it('rejects non-positive classId', () => {
    const r = studentAcademicSchema.safeParse({ ...valid, classId: 0 });
    expect(r.success).toBe(false);
  });
});

// ── studentParentSchema ───────────────────────────────────────────────────
describe('studentParentSchema', () => {
  const valid = { parentName: 'Jane Doe', parentPhone: '1234567890' };

  it('accepts valid input', () => {
    expect(studentParentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects parentName too short', () => {
    const r = studentParentSchema.safeParse({ ...valid, parentName: 'J' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid parentPhone', () => {
    const r = studentParentSchema.safeParse({ ...valid, parentPhone: '123' });
    expect(r.success).toBe(false);
  });
});

// ── feeStructureSchema ────────────────────────────────────────────────────
describe('feeStructureSchema', () => {
  const valid = {
    classId: 1,
    academicYear: '2024-2025',
    tuitionFee: 10000,
    transportFee: 2000,
    activityFee: 500,
    otherFee: 300,
  };

  it('accepts valid input', () => {
    expect(feeStructureSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid academicYear format', () => {
    const r = feeStructureSchema.safeParse({ ...valid, academicYear: '2024/2025' });
    expect(r.success).toBe(false);
  });

  it('rejects non-positive tuitionFee', () => {
    const r = feeStructureSchema.safeParse({ ...valid, tuitionFee: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects negative transportFee', () => {
    const r = feeStructureSchema.safeParse({ ...valid, transportFee: -1 });
    expect(r.success).toBe(false);
  });
});

// ── paymentSchema ─────────────────────────────────────────────────────────
describe('paymentSchema', () => {
  const valid = {
    studentId: 1,
    academicYear: '2024-2025',
    amount: 5000,
    paymentDate: '2024-01-15',
    paymentMethod: 'cash' as const,
  };

  it('accepts valid input', () => {
    expect(paymentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects amount of 0', () => {
    const r = paymentSchema.safeParse({ ...valid, amount: 0 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/greater than zero/i);
    }
  });

  it('rejects future paymentDate', () => {
    const r = paymentSchema.safeParse({ ...valid, paymentDate: '2099-01-01' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid paymentMethod', () => {
    const r = paymentSchema.safeParse({ ...valid, paymentMethod: 'bitcoin' });
    expect(r.success).toBe(false);
  });
});

// ── examSchema ────────────────────────────────────────────────────────────
describe('examSchema', () => {
  const valid = {
    name: 'Mid Term Exam',
    examType: 'mid_term' as const,
    classId: 1,
    subject: 'Mathematics',
    maxMarks: 100,
    passingMarks: 40,
    examDate: '2024-06-01',
  };

  it('accepts valid input', () => {
    expect(examSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects name too short', () => {
    const r = examSchema.safeParse({ ...valid, name: 'AB' });
    expect(r.success).toBe(false);
  });

  it('rejects passingMarks > maxMarks', () => {
    const r = examSchema.safeParse({ ...valid, passingMarks: 101 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/passing marks/i);
    }
  });

  it('accepts passingMarks === maxMarks', () => {
    expect(examSchema.safeParse({ ...valid, passingMarks: 100 }).success).toBe(true);
  });
});

// ── marksEntrySchema ──────────────────────────────────────────────────────
describe('marksEntrySchema', () => {
  it('accepts present student with marks', () => {
    expect(marksEntrySchema.safeParse({ marksObtained: 75, isAbsent: false }).success).toBe(true);
  });

  it('accepts absent student with 0 marks', () => {
    expect(marksEntrySchema.safeParse({ marksObtained: 0, isAbsent: true }).success).toBe(true);
  });

  it('accepts absent student with no marks', () => {
    expect(marksEntrySchema.safeParse({ isAbsent: true }).success).toBe(true);
  });

  it('rejects absent student with non-zero marks', () => {
    const r = marksEntrySchema.safeParse({ marksObtained: 50, isAbsent: true });
    expect(r.success).toBe(false);
  });

  it('rejects negative marks', () => {
    const r = marksEntrySchema.safeParse({ marksObtained: -1, isAbsent: false });
    expect(r.success).toBe(false);
  });
});

// ── timetableEntrySchema ──────────────────────────────────────────────────
describe('timetableEntrySchema', () => {
  const valid = {
    subject: 'Mathematics',
    teacherId: 1,
    startTime: '08:00',
    endTime: '09:00',
  };

  it('accepts valid input', () => {
    expect(timetableEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects endTime <= startTime', () => {
    const r = timetableEntrySchema.safeParse({ ...valid, endTime: '07:00' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/end time/i);
    }
  });

  it('rejects endTime === startTime', () => {
    const r = timetableEntrySchema.safeParse({ ...valid, endTime: '08:00' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const r = timetableEntrySchema.safeParse({ ...valid, startTime: '8:00' });
    expect(r.success).toBe(false);
  });

  it('rejects non-positive teacherId', () => {
    const r = timetableEntrySchema.safeParse({ ...valid, teacherId: 0 });
    expect(r.success).toBe(false);
  });
});
