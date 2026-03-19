import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';

const BASE = 'http://localhost:3000/api/v1';

/** MSW request handlers for all API endpoints. Requirements: 16.4 */
export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ token: fixtures.adminToken })
  ),
  http.post(`${BASE}/auth/verify`, () =>
    HttpResponse.json({ ok: true })
  ),

  // ── Students ──────────────────────────────────────────────────────────
  http.get(`${BASE}/students`, () =>
    HttpResponse.json({
      data: fixtures.students,
      pagination: { total: fixtures.students.length, page: 1, totalPages: 1, limit: 20 },
    })
  ),
  http.post(`${BASE}/students`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.students[0], ...body, id: 99 }, { status: 201 });
  }),
  http.get(`${BASE}/students/:id`, ({ params }) =>
    HttpResponse.json(fixtures.students.find((s) => s.id === Number(params.id)) ?? fixtures.students[0])
  ),
  http.put(`${BASE}/students/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.students[0], ...body, id: Number(params.id) });
  }),
  http.delete(`${BASE}/students/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),

  // ── Attendance ────────────────────────────────────────────────────────
  http.get(`${BASE}/attendance/class`, () =>
    HttpResponse.json(fixtures.attendanceRecords)
  ),
  http.post(`${BASE}/attendance`, () =>
    HttpResponse.json({ saved: fixtures.attendanceRecords.length })
  ),

  // ── Fees ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/fees/structures`, () =>
    HttpResponse.json({
      data: fixtures.feeStructures,
      pagination: { total: fixtures.feeStructures.length, page: 1, totalPages: 1, limit: 20 },
    })
  ),
  http.post(`${BASE}/fees/structures`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.feeStructures[0], ...body, id: 99 }, { status: 201 });
  }),
  http.get(`${BASE}/fees/payments`, () =>
    HttpResponse.json({
      data: fixtures.payments,
      pagination: { total: fixtures.payments.length, page: 1, totalPages: 1, limit: 20 },
    })
  ),
  http.post(`${BASE}/fees/payments`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.payments[0], ...body, id: 99 }, { status: 201 });
  }),
  http.get(`${BASE}/fees/student/:id`, () =>
    HttpResponse.json(fixtures.studentFeeStatus)
  ),
  http.get(`${BASE}/fees/pending`, () =>
    HttpResponse.json({
      data: fixtures.students.map((s) => ({ ...s, outstandingBalance: 5000 })),
      pagination: { total: 1, page: 1, totalPages: 1, limit: 20 },
    })
  ),

  // ── Exams ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/exams`, () =>
    HttpResponse.json({
      data: fixtures.exams,
      pagination: { total: fixtures.exams.length, page: 1, totalPages: 1, limit: 20 },
    })
  ),
  http.post(`${BASE}/exams`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.exams[0], ...body, id: 99 }, { status: 201 });
  }),
  http.get(`${BASE}/exams/:id/marks`, () =>
    HttpResponse.json(fixtures.marks)
  ),
  http.post(`${BASE}/exams/:id/marks`, () =>
    HttpResponse.json({ saved: fixtures.marks.length })
  ),
  http.put(`${BASE}/marks/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.marks[0], ...body, id: Number(params.id) });
  }),
  http.get(`${BASE}/exams/:id/results`, () =>
    HttpResponse.json(fixtures.examStatistics)
  ),
  http.get(`${BASE}/exams/student/:id`, () =>
    HttpResponse.json(fixtures.marks)
  ),

  // ── Timetable ─────────────────────────────────────────────────────────
  http.get(`${BASE}/timetable`, () =>
    HttpResponse.json(fixtures.timetableEntries)
  ),
  http.post(`${BASE}/timetable`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.timetableEntries[0], ...body, id: 99 }, { status: 201 });
  }),
  http.put(`${BASE}/timetable/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...fixtures.timetableEntries[0], ...body, id: Number(params.id) });
  }),
  http.delete(`${BASE}/timetable/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),
];
