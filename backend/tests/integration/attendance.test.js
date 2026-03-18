/**
 * Attendance Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const { supabase } = require('../../src/config/database');

const ADMIN = { email: 'admin@tensorschool.com', password: 'password' };
let adminToken;
let testStudentId;
let testClassId;
let testSectionId;

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send(ADMIN);
  adminToken = res.body.data.token;

  // Get a class/section
  const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
  const { data: sec } = await supabase.from('sections').select('id').eq('class_id', cls.id).limit(1).single();
  testClassId = cls.id;
  testSectionId = sec.id;

  // Create a test student
  const { data: student } = await supabase
    .from('students')
    .insert({
      admission_no: `ATT${Date.now()}`,
      first_name: 'Attend',
      last_name: 'Test',
      date_of_birth: '2010-01-01',
      gender: 'male',
      class_id: testClassId,
      section_id: testSectionId,
      admission_date: '2024-01-01'
    })
    .select('id')
    .single();

  testStudentId = student.id;
});

afterAll(async () => {
  if (testStudentId) {
    await supabase.from('attendance').delete().eq('student_id', testStudentId);
    await supabase.from('students').delete().eq('id', testStudentId);
  }
});

describe('POST /api/v1/attendance', () => {
  it('marks attendance for a student', async () => {
    const date = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        records: [{ studentId: testStudentId, date, status: 'present' }]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.present).toBe(1);
  });

  it('returns 400 on empty records array', async () => {
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ records: [] });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/attendance')
      .send({ records: [{ studentId: testStudentId, date: '2024-01-01', status: 'present' }] });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/attendance/student/:studentId', () => {
  it('returns attendance records for a student', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/student/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filters by date range', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/student/${testStudentId}?startDate=2024-01-01&endDate=2024-12-31`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/attendance/class', () => {
  it('returns class attendance', async () => {
    const date = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/v1/attendance/class?classId=${testClassId}&sectionId=${testSectionId}&date=${date}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 400 when classId missing', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/class?sectionId=${testSectionId}&date=2024-01-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
