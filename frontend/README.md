# Tensor School ERP — Frontend

React 19 + TypeScript SPA for the Tensor School management system. Built with Vite, MUI v6, TanStack Query, and React Router v7.

---

## Tech Stack

- React 19 + TypeScript
- Vite 8
- MUI v6 (Material Design 3 theme)
- TanStack Query v5
- React Router v7 (data router)
- React Hook Form v7 + Zod v3
- Recharts v2
- Axios
- DOMPurify (XSS sanitization)
- Sentry (error tracking)

### Testing
- Vitest v2 + Testing Library
- MSW v2 (API mocking)
- fast-check (property-based testing)

---

## Setup

### Prerequisites

- Node.js 18+
- Backend API running (see `../backend/README.md`)

### Install and run

```bash
npm install
cp .env.example .env   # configure VITE_API_URL
npm run dev            # http://localhost:5173
```

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | `https://...@sentry.io/...` |

---

## Scripts

```bash
npm run dev        # Start dev server with HMR
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
npx vitest --run   # Run all tests once (183 tests)
```

---

## Project Structure

```
src/
├── components/        # Shared UI components
├── pages/             # Route-level page components
│   ├── auth/          # Login page
│   ├── dashboard/     # Dashboard with analytics
│   ├── students/      # Student management
│   ├── attendance/    # Attendance tracking
│   ├── fees/          # Fee management
│   ├── exams/         # Exams and results
│   └── timetable/     # Timetable views
├── router/            # React Router v7 route definitions
├── hooks/             # Custom hooks (data fetching per domain)
├── services/          # Axios API client functions
├── schemas/           # Zod validation schemas
├── types/             # TypeScript type definitions
├── theme/             # MUI v6 MD3 theme
├── contexts/          # Auth context, other providers
├── config/            # App config (API URL, constants)
├── utils/             # Utility functions
└── test/              # MSW handlers, test setup, utilities
```

---

## Testing

```bash
npx vitest --run
```

183 tests covering components, hooks, services, and integration flows. MSW v2 intercepts all API calls during tests — no real network requests.

To run with coverage:

```bash
npx vitest --run --coverage
```

---

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy the `dist/` folder to Netlify, Vercel, or any static host.

Set the `VITE_API_URL` environment variable in your hosting platform to point to the production backend URL.
