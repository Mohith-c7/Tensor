/**
 * Student Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const { supabase } = require('../../src/config/database');

const ADMIN = { email: 'admin@tensorschool.com', password: 'password' };

let adminToken;
let classId;
let sectionId;
let createdStudentId;

// Helper to get a valid class and section from DB
async function getClassAndSection() {
  const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
  const { data: sec } = await supabase.from('sections').select('id').eq('class_id', cls.id).limit(1).single();
  return { classId: cls.id, sectionId: sec.id };
}

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send(ADMIN);
  adminToken = res.body.data.token;
  const ids = await getClassAndSection();
  classId = ids.classId;
  sectionId = ids.sectionId;
});

afterAll(async () => {
  // Clean up created test students
  if (createdStudentId) {
    await supabase.from('students').delete().eq('id', createdStudentId);
  }
});

const makeStudent = () => ({
  admissionNo: `TST${Date.now()}`,
  firstName: 'Test',
  lastName: 'Student',
  dateOfBirth: '2010-05-15',
  gender: 'male',
  classId,
  sectionId,
  admissionDate: '2024-06-01',
  parentName: 'Test Parent',
  parentPhone: '+1234567890'
});

describe('POST /api/v1/students', () => {
  it('creates a student as admin', async () => {
    const payload = makeStudent();
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admissionNo).toBe(payload.admissionNo);
    expect(res.body.data.firstName).toBe('Test');
    createdStudentId = res.body.data.id;
  });

  it('returns 409 on duplicate admission number', async () => {
    const payload = makeStudent();
    payload.admissionNo = `DUP${Date.now()}`;

    await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    // cleanup
    await supabase.from('students').delete().eq('admission_no', payload.admissionNo);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Only' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .send(makeStudent());

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/students', () => {
  it('returns paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toHaveProperty('total');
    expect(res.body.meta.pagination).toHaveProperty('page');
  });

  it('filters by classId', async () => {
    const res = await request(app)
      .get(`/api/v1/students?classId=${classId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(s => expect(s.classId).toBe(classId));
  });
});

describe('GET /api/v1/students/:id', () => {
  it('returns student by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdStudentId);
  });

  it('returns 404 for non-existent ID', async () => {
    const res = await request(app)
      .get('/api/v1/students/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/students/:id', () => {
  it('updates student fields', async () => {
    const res = await request(app)
      .put(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Updated');
  });

  it('returns 400 on empty update body', async () => {
    const res = await request(app)
      .put(`/api/v1/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/students/:id', () => {
  it('deletes a student', async () => {
    // Create a fresh student to delete
    const payload = makeStudent();
    payload.admissionNo = `DEL${Date.now()}`;
    const create = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const id = create.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/students/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify gone
    const check = await request(app)
      .get(`/api/v1/students/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(check.status).toBe(404);
  });
});
