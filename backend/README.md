# Tensor School ERP — Backend API

Enterprise-grade REST API for the Tensor School management system. Built with Node.js, Express, and Supabase.

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Caching**: node-cache (in-memory)
- **Logging**: Winston + daily-rotate-file
- **Docs**: Swagger UI (OpenAPI 3.0)
- **Testing**: Jest + Supertest

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project with the schema applied

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Secret key, minimum 32 characters |
| `JWT_EXPIRES_IN` | Token expiry, e.g. `24h` |
| `PORT` | Server port (default: `5000`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### 3. Initialize the database

Run `src/database/schema.sql` in the Supabase SQL editor, then `src/database/seed.sql` for initial data.

Default admin credentials: `admin@tensorschool.com` / `password`

### 4. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`  
API docs at `http://localhost:5000/api-docs`  
Health check at `http://localhost:5000/health`

---

## Docker

### Build and run

```bash
# Copy and configure environment
cp .env.example .env

# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Build image only

```bash
docker build -t tensor-backend .
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Authentication uses Bearer tokens.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/verify` | Verify token validity | Yes |

### Students

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/students` | Create student | Admin |
| GET | `/students` | List students (paginated) | Any |
| GET | `/students/:id` | Get student by ID | Any |
| PUT | `/students/:id` | Update student | Admin |
| DELETE | `/students/:id` | Delete student | Admin |

### Attendance

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/attendance` | Mark bulk attendance | Teacher/Admin |
| GET | `/attendance/student/:studentId` | Student attendance history | Teacher/Admin |
| GET | `/attendance/class` | Class attendance by date | Teacher/Admin |
| GET | `/attendance/stats/:studentId` | Attendance statistics | Teacher/Admin |

### Fees

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/fees/structures` | Create fee structure | Admin |
| GET | `/fees/structures` | List fee structures | Any |
| POST | `/fees/payments` | Record payment | Admin |
| GET | `/fees/student/:studentId` | Student fee status | Any |
| GET | `/fees/pending` | Pending fees report | Admin |

### Exams

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/exams` | Create exam | Admin |
| POST | `/exams/:examId/marks` | Enter marks (bulk) | Teacher/Admin |
| PUT | `/marks/:markId` | Update marks | Teacher/Admin |
| GET | `/exams/student/:studentId` | Student results | Any |
| GET | `/exams/:examId/results` | Class results + stats | Any |

### Timetable

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/timetable` | Create entry | Admin |
| GET | `/timetable/class` | Class timetable | Any |
| GET | `/timetable/teacher/:teacherId` | Teacher timetable | Any |
| PUT | `/timetable/:id` | Update entry | Admin |
| DELETE | `/timetable/:id` | Delete entry | Admin |

---

## Testing

```bash
# All tests
npm test

# Integration tests only
npm run test:integration

# Unit tests only
npm run test:unit

# With coverage report
npm run test:coverage
```

Coverage threshold: 80% across branches, functions, lines, and statements.

---

## Project Structure

```
src/
├── app.js              # Express app setup
├── server.js           # Entry point, graceful shutdown
├── config/
│   ├── index.js        # Env config with validation
│   ├── database.js     # Supabase client
│   ├── cache.js        # node-cache setup
│   └── logger.js       # Winston logger
├── middleware/
│   ├── auth.js         # JWT authentication
│   ├── rbac.js         # Role-based access control
│   ├── cors.js         # CORS configuration
│   ├── rateLimiter.js  # Rate limiting
│   ├── validator.js    # Joi request validation
│   ├── requestLogger.js# HTTP request/response logging
│   └── errorHandler.js # Centralized error handling
├── services/           # Business logic layer
├── routes/             # Express route handlers
├── models/
│   └── schemas.js      # Joi validation schemas
├── utils/
│   ├── errors.js       # Custom error classes
│   ├── cache.js        # Cache service
│   ├── database.js     # DB utilities (retry, health)
│   ├── audit.js        # Audit logging
│   └── serializer.js   # Response formatting
├── docs/
│   └── swagger.js      # OpenAPI 3.0 spec
└── database/
    ├── schema.sql       # Database schema
    └── seed.sql         # Seed data
```

---

## Security

- JWT tokens expire in 24 hours
- Passwords hashed with bcrypt (10 salt rounds)
- Rate limiting: 5 auth attempts / 15 min, 100 API requests / 15 min
- CORS restricted to configured origins
- All inputs validated and sanitized via Joi
- Role-based access control (admin / teacher)
- Audit logs for all CREATE/UPDATE/DELETE operations
- No stack traces exposed in production responses
