# Tensor School ERP — Frontend

Enterprise-grade React application for the Tensor School management system. Built with React 19, TypeScript, Material-UI v6, and modern best practices.

---

## Tech Stack

### Core
- **React 19** - Latest React with automatic JSX runtime
- **TypeScript 5.9** - Type-safe development with strict mode
- **Vite 8** - Lightning-fast build tool and dev server
- **React Router 7** - Client-side routing with data loading

### UI Framework
- **Material-UI v6** - Enterprise-grade component library
- **Emotion** - CSS-in-JS styling solution
- **Recharts** - Composable charting library

### State Management
- **TanStack Query v5** - Server state management with caching
- **React Context** - Global state (auth, theme, toast)
- **React Hook Form** - Performant form state management

### Data & Validation
- **Zod** - TypeScript-first schema validation
- **Axios** - HTTP client with interceptors
- **date-fns** - Modern date utility library

### Quality & Testing
- **Vitest** - Fast unit test runner
- **Testing Library** - User-centric testing utilities
- **fast-check** - Property-based testing
- **MSW** - API mocking for tests

### Security & Monitoring
- **DOMPurify** - XSS protection for user content
- **Sentry** - Error tracking and performance monitoring

---

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running (see `../backend/README.md`)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Tensor School ERP
VITE_SENTRY_DSN=your-sentry-dsn (optional)
```

### 3. Start development server
```bash
npm run dev
```

Application starts at `http://localhost:5173`

### 4. Build for production
```bash
npm run build
```

Output in `dist/` directory (2.2MB with code splitting)

### 5. Preview production build
```bash
npm run preview
```

---

## Project Structure

```
src/
├── api/                    # API client and service layer
│   ├── apiClient.ts        # Axios instance with interceptors
│   ├── auth.api.ts         # Authentication endpoints
│   ├── students.api.ts     # Student management endpoints
│   ├── attendance.api.ts   # Attendance endpoints
│   ├── fees.api.ts         # Fee management endpoints
│   ├── exams.api.ts        # Exam and marks endpoints
│   ├── timetable.api.ts    # Timetable endpoints
│   └── dashboard.api.ts    # Dashboard analytics endpoints
│
├── components/             # Reusable UI components
│   ├── common/             # Generic components
│   │   ├── DataTable.tsx   # Sortable, paginated table
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingButton.tsx
│   │   └── SearchBar.tsx
│   ├── data-display/       # Data visualization
│   │   ├── AttendanceCalendar.tsx
│   │   ├── StatCard.tsx
│   │   ├── AttendanceChart.tsx
│   │   └── FeeCollectionChart.tsx
│   ├── feedback/           # User feedback
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   └── ToastContainer.tsx
│   ├── guards/             # Route protection
│   │   └── ProtectedRoute.tsx
│   └── layout/             # Layout components
│       ├── AppShellLayout.tsx
│       ├── AuthLayout.tsx
│       ├── TopBar.tsx
│       └── Sidebar.tsx
│
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   ├── ThemeContext.tsx    # Light/dark mode
│   └── ToastContext.tsx    # Global notifications
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useToast.ts         # Toast notifications hook
│   └── useTheme.ts         # Theme toggle hook
│
├── pages/                  # Page components (route targets)
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── students/
│   │   ├── StudentsPage.tsx
│   │   ├── StudentNewPage.tsx
│   │   ├── StudentEditPage.tsx
│   │   └── StudentProfilePage.tsx
│   ├── attendance/
│   │   ├── AttendancePage.tsx
│   │   └── AttendanceStudentPage.tsx
│   ├── fees/
│   │   ├── FeeStructuresPage.tsx
│   │   ├── FeeStructureNewPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── PaymentNewPage.tsx
│   │   ├── StudentFeePage.tsx
│   │   └── PendingFeesPage.tsx
│   ├── exams/
│   │   ├── ExamsPage.tsx
│   │   ├── ExamNewPage.tsx
│   │   ├── ExamMarksPage.tsx
│   │   ├── ExamResultsPage.tsx
│   │   └── StudentResultsPage.tsx
│   ├── timetable/
│   │   ├── TimetablePage.tsx
│   │   └── TeacherTimetablePage.tsx
│   └── errors/
│       ├── NotFoundPage.tsx
│       └── ForbiddenPage.tsx
│
├── router/                 # Routing configuration
│   ├── index.tsx           # Route definitions
│   ├── routes.ts           # Route constants
│   └── handles.ts          # Route metadata (breadcrumbs)
│
├── schemas/                # Zod validation schemas
│   ├── auth.schema.ts
│   ├── student.schema.ts
│   ├── attendance.schema.ts
│   ├── fee.schema.ts
│   ├── exam.schema.ts
│   └── timetable.schema.ts
│
├── types/                  # TypeScript type definitions
│   ├── api.types.ts        # API request/response types
│   ├── auth.types.ts       # Authentication types
│   ├── student.types.ts    # Student entity types
│   └── ...
│
├── utils/                  # Utility functions
│   ├── formatters.ts       # Date, currency formatters
│   ├── validators.ts       # Custom validators
│   └── constants.ts        # App constants
│
├── config/                 # Configuration
│   └── queryClient.ts      # React Query configuration
│
├── App.tsx                 # Root component
├── main.tsx                # Application entry point
└── vite-env.d.ts           # Vite type definitions
```

---

## Features

### Authentication & Authorization
- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (Admin, Teacher)
- ✅ Protected routes with automatic redirect
- ✅ Password reset flow (forgot/reset/change)
- ✅ Session management (logout, revoke all devices)

### Dashboard
- ✅ Key performance indicators (KPI cards)
- ✅ Attendance trend chart (last 7 days)
- ✅ Fee collection statistics
- ✅ Recent activity feed

### Student Management
- ✅ List students with search, filter, pagination
- ✅ Create/edit/delete students (admin only)
- ✅ Student profile view with complete details
- ✅ Admission number auto-generation
- ✅ Parent information management

### Attendance Management
- ✅ Mark attendance (bulk entry)
- ✅ Student attendance history with calendar view
- ✅ Attendance statistics (present/absent/late/excused)
- ✅ Class attendance by date range

### Fee Management
- ✅ Fee structure management (per class, per year)
- ✅ Record payments with transaction tracking
- ✅ Student fee status (paid/pending/overdue)
- ✅ Pending fees report with filters
- ✅ Payment history with receipts

### Exam & Marks Management
- ✅ Create exams (unit test, mid-term, final, practical)
- ✅ Enter marks (bulk entry)
- ✅ Update individual marks
- ✅ Student results with grade calculation
- ✅ Class results with statistics (avg, highest, lowest, pass rate)

### Timetable Management
- ✅ Create/edit/delete timetable entries
- ✅ Class timetable view (by day)
- ✅ Teacher timetable view
- ✅ Conflict detection

### UI/UX Features
- ✅ Light/dark mode toggle
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Toast notifications for user feedback
- ✅ Loading states and skeletons
- ✅ Error boundaries for crash recovery
- ✅ Confirmation dialogs for destructive actions
- ✅ Breadcrumb navigation
- ✅ CSV export for data tables

---

## Architecture

### State Management Strategy

**Server State** (TanStack Query):
- API data fetching and caching
- Automatic background refetching
- Optimistic updates for mutations
- Request deduplication

**Client State** (React Context):
- Authentication state (user, token)
- Theme preference (light/dark)
- Toast notifications queue

**Form State** (React Hook Form):
- Form input values
- Validation errors
- Submission state

### API Integration

All API calls go through `apiClient.ts` which provides:
- Automatic JWT token injection
- Request/response interceptors
- Error handling with toast notifications
- Request/response logging (dev mode)

Example API service:
```typescript
// src/api/students.api.ts
export const studentsApi = {
  getAll: (params: StudentQueryParams) =>
    apiClient.get<PaginatedResponse<Student>>('/students', { params }),
  
  getById: (id: number) =>
    apiClient.get<ApiResponse<Student>>(`/students/${id}`),
  
  create: (data: CreateStudentDto) =>
    apiClient.post<ApiResponse<Student>>('/students', data),
  
  update: (id: number, data: UpdateStudentDto) =>
    apiClient.put<ApiResponse<Student>>(`/students/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/students/${id}`),
};
```

### Form Validation

All forms use Zod schemas for type-safe validation:

```typescript
// src/schemas/student.schema.ts
export const createStudentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine(isValidDate, 'Invalid date'),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  classId: z.number().positive('Class is required'),
  sectionId: z.number().positive('Section is required'),
  // ... more fields
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
```

### Error Handling

**Component-level**: Error boundaries catch React errors
```tsx
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

**API-level**: Axios interceptors handle HTTP errors
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    toast.error(error.response?.data?.error?.message || 'An error occurred');
    return Promise.reject(error);
  }
);
```

**Route-level**: Protected routes handle authorization
```tsx
<ProtectedRoute requiredRole="admin">
  <AdminOnlyPage />
</ProtectedRoute>
```

---

## Testing

### Run Tests
```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/                   # Component unit tests
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/            # API integration tests
│   └── api/
└── property/               # Property-based tests
    └── schemas/
```

### Testing Best Practices

**Component Tests**:
```typescript
import { render, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

**API Tests with MSW**:
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: { accessToken: 'token' } }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Performance Optimization

### Code Splitting
- Lazy-loaded route components
- Dynamic imports for heavy libraries
- Suspense boundaries with loading fallbacks

### Caching Strategy
- TanStack Query cache (5 minutes stale time)
- Aggressive prefetching for common routes
- Optimistic updates for mutations

### Bundle Size
- Production build: 2.2MB (gzipped: ~600KB)
- Code splitting: 15+ chunks
- Tree-shaking for unused code

### Rendering Optimization
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Virtual scrolling for large lists (react-window)

---

## Security

### XSS Protection
- DOMPurify for user-generated content
- React's built-in XSS protection (JSX escaping)
- Content Security Policy headers

### Authentication
- JWT tokens stored in memory (not localStorage)
- Refresh tokens for session management
- Automatic token refresh before expiry

### Authorization
- Role-based route protection
- Component-level permission checks
- API-level authorization (backend enforced)

### Input Validation
- Client-side validation with Zod
- Server-side validation (backend enforced)
- Sanitization of user inputs

---

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create `.env.production`:
```env
VITE_API_BASE_URL=https://api.tensorschool.com/api/v1
VITE_APP_NAME=Tensor School ERP
VITE_SENTRY_DSN=your-production-sentry-dsn
```

### Deployment Options

**Static Hosting** (Vercel, Netlify, Cloudflare Pages):
```bash
npm run build
# Deploy dist/ directory
```

**Docker**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration**:
```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Troubleshooting

### Common Issues

**Build Errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**:
```bash
# Check TypeScript version
npm list typescript

# Rebuild TypeScript
npm run build
```

**API Connection Issues**:
- Check `VITE_API_BASE_URL` in `.env`
- Verify backend is running
- Check CORS configuration in backend

**Theme Not Persisting**:
- Check localStorage is enabled
- Clear browser cache

---

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile: iOS 12+, Android 8+

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules (`npm run lint`)
- Use Prettier for formatting
- Write tests for new features

### Commit Convention
```
feat: Add student bulk import
fix: Fix attendance calendar date picker
docs: Update README with deployment guide
test: Add tests for fee payment flow
```

---

## License

Proprietary - Tensor School ERP

---

## Support

For issues or questions:
- Backend API: See `../backend/README.md`
- Database Setup: See `../backend/SETUP.md`
- Quick Start: See `../backend/QUICK_SETUP.md`

---

**Built with ❤️ using React 19, TypeScript, and Material-UI v6**
