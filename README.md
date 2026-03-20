# Tensor School ERP

A full-stack enterprise school management system built with React 19 + TypeScript on the frontend and Node.js + Express + Supabase on the backend.

Covers student management, attendance, fees, exams, timetable, and role-based access control — all in a monorepo structure.

---

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite 8
- MUI v6 (Material Design 3 theme)
- TanStack Query v5 (server state)
- React Router v7 (data router)
- React Hook Form + Zod (forms & validation)
- Recharts (dashboard analytics)
- MSW v2 (API mocking in tests)
- Vitest + Testing Library (183 tests)

### Backend
- Node.js 18+ + Express 4
- Supabase (PostgreSQL)
- JWT authentication
- Joi validation
- Winston logging + daily-rotate-file
- node-cache (in-memory caching)
- Swagger / OpenAPI 3.0 docs
- Jest + Supertest

---

## Project Structure

```
tensor-school-erp/
├── frontend/          # React + TypeScript SPA
├── backend/           # Node.js + Express REST API
├── README.md
└── SYSTEM_ARCHITECTURE.md
```

---

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
npm run dev            # http://localhost:5000
```

Apply the database schema in the Supabase SQL editor:
- `backend/src/database/schema.sql`
- `backend/src/database/seed.sql`

Default admin: `admin@tensorschool.com` / `password`

API docs: `http://localhost:5000/api-docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api/v1
npm run dev            # http://localhost:5173
```

---

## Features

| Module | Description |
|---|---|
| Authentication | JWT login, token verification, sessionStorage |
| RBAC | Admin and Teacher roles, ProtectedRoute, PermissionGate |
| Students | Full CRUD, class/section assignment, parent details |
| Attendance | Bulk mark, date/class filters, per-student stats |
| Fees | Fee structures, payment recording, pending dues report |
| Exams | Exam creation, bulk marks entry, results with grade stats |
| Timetable | Weekly schedule, class and teacher views |
| Dashboard | Analytics charts, summary cards, recent activity |

---

## Testing

```bash
# Frontend (183 tests)
cd frontend
npx vitest --run

# Backend
cd backend
npm test
npm run test:coverage   # 80% threshold
```

---

## Deployment

| Layer | Platform |
|---|---|
| Frontend | Netlify / Vercel |
| Backend | Render / Railway (or Docker) |
| Database | Supabase (managed PostgreSQL) |

Docker support is included for the backend — see `backend/docker-compose.yml`.

---

## Documentation

- [Backend API & Setup](backend/README.md)
- [Backend Environment Setup](backend/SETUP.md)
- [Frontend Guide](frontend/README.md)
- [System Architecture](SYSTEM_ARCHITECTURE.md)
