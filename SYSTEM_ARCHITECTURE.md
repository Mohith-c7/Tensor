# Tensor School ERP — System Architecture

## Overview

Tensor is a monorepo school ERP system with a React SPA frontend and a Node.js REST API backend, backed by Supabase (PostgreSQL). It follows a clean layered architecture on both sides with a strong emphasis on type safety, validation, and testability.

---

## High-Level Architecture

```
Browser (React SPA)
        ↓  HTTPS / REST
Express API (Node.js)
        ↓  Supabase JS client
Supabase (PostgreSQL)
```

---

## Frontend Architecture

### Tech Stack

| Concern | Library / Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| UI Components | MUI v6 (Material Design 3) |
| Server State | TanStack Query v5 |
| Routing | React Router v7 (data router) |
| Forms | React Hook Form v7 + Zod v3 |
| Charts | Recharts v2 |
| HTTP | Axios |
| Security | DOMPurify (XSS sanitization) |
| Error Tracking | Sentry |
| Testing | Vitest v2 + Testing Library + MSW v2 + fast-check |

### Directory Structure

```
frontend/src/
├── components/        # Shared UI components
├── pages/             # Route-level page components
├── router/            # React Router v7 route definitions
├── hooks/             # Custom React hooks (data fetching, etc.)
├── services/          # Axios API client functions
├── schemas/           # Zod validation schemas
├── types/             # TypeScript type definitions
├── theme/             # MUI v6 MD3 theme configuration
├── context/           # React context providers
├── contexts/          # Additional context (auth, etc.)
├── config/            # App-level config (API base URL, etc.)
├── utils/             # Utility functions
└── test/              # MSW handlers, test utilities, setup
```

### Key Patterns

**Server state** is managed entirely by TanStack Query v5. All API calls go through custom hooks that wrap `useQuery` / `useMutation`, keeping components free of data-fetching logic.

**Forms** use React Hook Form with Zod resolvers. Schemas are defined once in `src/schemas/` and reused for both form validation and TypeScript types.

**Routing** uses React Router v7's data router with `createBrowserRouter`. Protected routes are wrapped in `ProtectedRoute` (auth check) and `PermissionGate` (role check).

**Theme** is a custom MUI v6 Material Design 3 theme defined in `src/theme/`. All components use the theme tokens — no hardcoded colors.

**Testing** uses Vitest + Testing Library for component and integration tests, MSW v2 for API mocking, and fast-check for property-based tests. 183 tests total.

---

## Backend Architecture

### Tech Stack

| Concern | Library / Tool |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | Supabase (PostgreSQL via supabase-js) |
| Auth | jsonwebtoken (JWT) |
| Validation | Joi |
| Caching | node-cache (in-memory) |
| Logging | Winston + winston-daily-rotate-file |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Testing | Jest + Supertest |

### Directory Structure

```
backend/src/
├── app.js              # Express app setup, middleware registration
├── server.js           # Entry point, graceful shutdown
├── config/
│   ├── index.js        # Env config with validation
│   ├── database.js     # Supabase client
│   ├── cache.js        # node-cache instance
│   └── logger.js       # Winston logger
├── middleware/
│   ├── auth.js         # JWT verification
│   ├── rbac.js         # Role-based access control
│   ├── cors.js         # CORS configuration
│   ├── rateLimiter.js  # Rate limiting (express-rate-limit)
│   ├── validator.js    # Joi request validation
│   ├── requestLogger.js# HTTP request/response logging
│   └── errorHandler.js # Centralized error handling
├── services/           # Business logic (one file per domain)
├── routes/             # Express route handlers
├── models/
│   └── schemas.js      # Joi validation schemas
├── utils/
│   ├── errors.js       # Custom error classes (AppError, etc.)
│   ├── cache.js        # Cache service wrapper
│   ├── database.js     # DB utilities (retry, health check)
│   ├── audit.js        # Audit logging for mutations
│   └── serializer.js   # Response formatting
├── docs/
│   └── swagger.js      # OpenAPI 3.0 spec
└── database/
    ├── schema.sql       # Full database schema
    └── seed.sql         # Initial seed data
```

### Request Lifecycle

```
Incoming Request
      ↓
CORS middleware
      ↓
Rate limiter
      ↓
Request logger
      ↓
JWT auth middleware (protected routes)
      ↓
RBAC middleware (role-restricted routes)
      ↓
Joi validation middleware
      ↓
Route handler
      ↓
Service layer (business logic + DB queries)
      ↓
Supabase (PostgreSQL)
      ↓
Serializer → JSON response
```

---

## Authentication Flow

1. Client POSTs credentials to `POST /api/v1/auth/login`
2. Backend verifies email/password (bcrypt compare)
3. JWT signed with `JWT_SECRET`, expires in 24h
4. Token returned to client, stored in `sessionStorage`
5. All subsequent requests include `Authorization: Bearer <token>`
6. `auth.js` middleware verifies token on every protected route
7. On app init, `POST /api/v1/auth/verify` confirms token is still valid

---

## RBAC Model

Two roles: `admin` and `teacher`.

| Operation | Admin | Teacher |
|---|---|---|
| Create/update/delete students | ✓ | ✗ |
| View students | ✓ | ✓ |
| Mark attendance | ✓ | ✓ |
| Enter exam marks | ✓ | ✓ |
| Create exams / fee structures | ✓ | ✗ |
| View reports | ✓ | ✓ |
| Manage timetable | ✓ | ✗ |

Frontend enforces this via `ProtectedRoute` (redirects unauthenticated users) and `PermissionGate` (hides/disables UI elements based on role). Backend enforces it independently via the `rbac.js` middleware on every route.

---

## Database Schema (Supabase / PostgreSQL)

Core tables:

| Table | Description |
|---|---|
| `users` | Auth users with hashed passwords and roles |
| `students` | Student records with class/section assignment |
| `parents` | Parent/guardian contact details |
| `classes` | Class definitions |
| `sections` | Sections per class |
| `attendance` | Daily attendance records per student |
| `fee_structures` | Fee amounts per class |
| `fee_payments` | Payment records per student |
| `exams` | Exam definitions |
| `marks` | Per-student, per-subject marks per exam |
| `timetable` | Weekly schedule entries |

Full schema: `backend/src/database/schema.sql`

---

## Caching Strategy

node-cache is used for read-heavy endpoints:

- Fee structures (invalidated on create/update)
- Class and section lists
- Timetable entries

Cache TTL is configurable via environment variables. Cache is invalidated on any mutation to the relevant resource.

---

## Deployment Architecture

```
Netlify / Vercel          Render / Railway           Supabase
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  React SPA      │─────▶│  Express API     │─────▶│  PostgreSQL  │
│  (static build) │      │  (Node.js 18+)   │      │  (managed)   │
└─────────────────┘      │  or Docker       │      └──────────────┘
                         └──────────────────┘
```

The frontend is a fully static build (`npm run build`) deployed to a CDN. The backend can run as a plain Node process or via the included `Dockerfile` + `docker-compose.yml`.

---

## Security

| Concern | Implementation |
|---|---|
| Password storage | bcrypt, 10 salt rounds |
| Auth tokens | JWT, 24h expiry, `sessionStorage` |
| Input validation | Joi (backend), Zod (frontend) |
| XSS prevention | DOMPurify on all user-generated content |
| Rate limiting | 5 auth attempts / 15 min, 100 API requests / 15 min |
| CORS | Restricted to configured `ALLOWED_ORIGINS` |
| Error responses | No stack traces in production |
| Audit trail | All CREATE/UPDATE/DELETE operations logged |
