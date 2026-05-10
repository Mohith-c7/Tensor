/**
 * Timetable Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');
const { supabase } = require('../../src/config/database');

const ADMIN = { email: 'admin@tensorschool.com', password: 'Admin@123' };
let adminToken;
let testClassId;
let testSectionId;
let createdEntryId;

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/login').send(ADMIN);
  adminToken = res.body.data.accessToken || res.body.data.token;

  const { data: cls } = await supabase.from('classes').select('id').limit(1).single();
  const { data: sec } = await supabase.from('sections').select('id').eq('class_id', cls.id).limit(1).single();
  testClassId = cls.id;
  testSectionId = sec.id;

  // Clean up any leftover test entries
  await supabase.from('timetable')
    .delete()
    .eq('class_id', testClassId)
    .eq('section_id', testSectionId)
    .eq('day_of_week', 'friday')
    .eq('period_number', 9);
});

afterAll(async () => {
  if (createdEntryId) {
    await supabase.from('timetable').delete().eq('id', createdEntryId);
  }
});

describe('POST /api/v1/timetable', () => {
  it('creates a timetable entry', async () => {
    const res = await request(app)
      .post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: testClassId,
        sectionId: testSectionId,
        dayOfWeek: 'friday',
        periodNumber: 9,
        startTime: '14:00',
        endTime: '14:45',
        subject: 'Integration Test Subject'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subject).toBe('Integration Test Subject');
    expect(res.body.data.dayOfWeek).toBe('friday');
    createdEntryId = res.body.data.id;
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId: testClassId });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/timetable')
      .send({ classId: testClassId, sectionId: testSectionId });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/timetable/class', () => {
  it('returns class timetable', async () => {
    const res = await request(app)
      .get(`/api/v1/timetable/class?classId=${testClassId}&sectionId=${testSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filters by dayOfWeek', async () => {
    const res = await request(app)
      .get(`/api/v1/timetable/class?classId=${testClassId}&sectionId=${testSectionId}&dayOfWeek=friday`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(e => expect(e.dayOfWeek).toBe('friday'));
  });

  it('returns 400 when classId missing', async () => {
    const res = await request(app)
      .get(`/api/v1/timetable/class?sectionId=${testSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/timetable/:id', () => {
  it('updates a timetable entry', async () => {
    const res = await request(app)
      .put(`/api/v1/timetable/${createdEntryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subject: 'Updated Subject' });

    expect(res.status).toBe(200);
    expect(res.body.data.subject).toBe('Updated Subject');
  });

  it('returns 400 on empty update body', async () => {
    const res = await request(app)
      .put(`/api/v1/timetable/${createdEntryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/timetable/:id', () => {
  it('deletes a timetable entry', async () => {
    // Create a fresh entry to delete
    const create = await request(app)
      .post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: testClassId,
        sectionId: testSectionId,
        dayOfWeek: 'saturday',
        periodNumber: 10,
        startTime: '15:00',
        endTime: '15:45',
        subject: 'To Delete'
      });

    const id = create.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/timetable/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
