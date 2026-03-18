/**
 * Exam Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const { supabase } = require('../../src/config/database');

const ADMIN = { email: 'admin@tensorschool.com', password: 'password' };
let adminToken;
let testClassId;
let testSectionId;
let testStudentId;
let testExamId;
let testMarkId;

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send(ADMIN);
  adminToken = res.body.data.token;

  const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
  const { data: sec } = await supabase.from('sections').select('id').eq('class_id', cls.id).limit(1).single();
  testClassId = cls.id;
  testSectionId = sec.id;

  const { data: student } = await supabase
    .from('students')
    .insert({
      admission_no: `EXM${Date.now()}`,
      first_name: 'Exam',
      last_name: 'Student',
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
  if (testExamId) {
    await supabase.from('marks').delete().eq('exam_id', testExamId);
    await supabase.from('exams').delete().eq('id', testExamId);
  }
  if (testStudentId) {
    await supabase.from('students').delete().eq('id', testStudentId);
  }
});

describe('POST /api/v1/exams', () => {
  it('creates an exam', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Integration Test Exam',
        examType: 'unit_test',
        classId: testClassId,
        subject: 'Mathematics',
        examDate: '2024-11-15',
        maxMarks: 100,
        passingMarks: 40
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Integration Test Exam');
    expect(res.body.data.maxMarks).toBe(100);
    testExamId = res.body.data.id;
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/exams/:examId/marks', () => {
  it('enters marks for students', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${testExamId}/marks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        marks: [{ studentId: testStudentId, marksObtained: 75, isAbsent: false }]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalEntered).toBe(1);
  });

  it('returns 409 on duplicate marks entry', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${testExamId}/marks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        marks: [{ studentId: testStudentId, marksObtained: 80 }]
      });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/v1/exams/marks/:markId', () => {
  beforeAll(async () => {
    const { data } = await supabase
      .from('marks')
      .select('id')
      .eq('exam_id', testExamId)
      .eq('student_id', testStudentId)
      .single();
    testMarkId = data?.id;
  });

  it('updates a mark', async () => {
    const res = await request(app)
      .put(`/api/v1/exams/marks/${testMarkId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ marksObtained: 85, remarks: 'Revised' });

    expect(res.status).toBe(200);
    expect(res.body.data.marksObtained).toBe(85);
  });
});

describe('GET /api/v1/exams/student/:studentId', () => {
  it('returns student results', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/student/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('percentage');
    expect(res.body.data[0]).toHaveProperty('passed');
  });
});

describe('GET /api/v1/exams/:examId/results', () => {
  it('returns class results with statistics', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/${testExamId}/results`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('exam');
    expect(res.body.data).toHaveProperty('statistics');
    expect(res.body.data).toHaveProperty('results');
    expect(res.body.data.statistics).toHaveProperty('average');
    expect(res.body.data.statistics).toHaveProperty('passRate');
  });

  it('returns 404 for non-existent exam', async () => {
    const res = await request(app)
      .get('/api/v1/exams/999999999/results')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
