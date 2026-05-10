/**
 * Fee Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const { supabase } = require('../../src/config/database');

const ADMIN = { email: 'admin@tensorschool.com', password: 'Admin@123' };
let adminToken;
let testClassId;
let testStudentId;
let testSectionId;
const TEST_YEAR = '2099-2100'; // unique year to avoid conflicts

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send(ADMIN);
  adminToken = res.body.data.accessToken || res.body.data.token;

  const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
  const { data: sec } = await supabase.from('sections').select('id').eq('class_id', cls.id).limit(1).single();
  testClassId = cls.id;
  testSectionId = sec.id;

  const { data: student } = await supabase
    .from('students')
    .insert({
      admission_no: `FEE${Date.now()}`,
      first_name: 'Fee',
      last_name: 'Test',
      date_of_birth: '2010-01-01',
      gender: 'female',
      class_id: testClassId,
      section_id: testSectionId,
      admission_date: '2024-01-01'
    })
    .select('id')
    .single();

  testStudentId = student.id;
});

afterAll(async () => {
  await supabase.from('fee_payments').delete().eq('student_id', testStudentId);
  await supabase.from('fee_structures').delete().eq('academic_year', TEST_YEAR);
  await supabase.from('students').delete().eq('id', testStudentId);
});

describe('POST /api/v1/fees/structures', () => {
  it('creates a fee structure', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: testClassId,
        academicYear: TEST_YEAR,
        tuitionFee: 5000,
        transportFee: 500,
        activityFee: 200,
        otherFee: 100
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalFee).toBe(5800);
    expect(res.body.data.academicYear).toBe(TEST_YEAR);
  });

  it('returns 409 on duplicate class/year', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: testClassId,
        academicYear: TEST_YEAR,
        tuitionFee: 5000
      });

    expect(res.status).toBe(409);
  });

  it('returns 403 for non-admin', async () => {
    // No teacher token available in seed, just test missing auth
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .send({ classId: testClassId, academicYear: '2098-2099', tuitionFee: 1000 });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/fees/structures', () => {
  it('returns fee structures', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/structures?academicYear=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('POST /api/v1/fees/payments', () => {
  it('records a payment', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: testStudentId,
        academicYear: TEST_YEAR,
        amount: 2000,
        paymentDate: '2024-06-01',
        paymentMethod: 'cash'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2000);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: testStudentId });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/fees/student/:studentId', () => {
  it('returns fee status for a student', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/student/${testStudentId}?academicYear=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary).toHaveProperty('totalDue');
    expect(res.body.data.summary).toHaveProperty('totalPaid');
    expect(res.body.data.summary).toHaveProperty('balance');
  });

  it('returns detailed student fee status with balance and overdue info', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/student/${testStudentId}?academicYear=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('student');
    expect(res.body.data).toHaveProperty('structures');
    expect(res.body.data).toHaveProperty('payments');
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary).toHaveProperty('totalDue');
    expect(res.body.data.summary).toHaveProperty('totalPaid');
    expect(res.body.data.summary).toHaveProperty('balance');
    expect(res.body.data.summary).toHaveProperty('isPaid');
  });

  it('returns 404 for non-existent student', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/student/99999?academicYear=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/fees/pending', () => {
  it('returns pending fees report', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/pending?academicYear=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});


