# Requirements Document

## Introduction

This document specifies the requirements for the enterprise-grade frontend of the Tensor School ERP system. The frontend is a React 19 + TypeScript single-page application that consumes the existing Node.js/Express REST API at `/api/v1`. It serves two user roles — Admin and Teacher — with role-specific dashboards, navigation, and feature access. The system covers authentication, student management, attendance, fees, exams, timetable, and cross-cutting concerns including design system, accessibility, performance, security, and testing.

## Glossary

- **App**: The Tensor frontend React SPA
- **Auth_Service**: The frontend module responsible for JWT token management, storage, and session lifecycle
- **API_Client**: The Axios-based HTTP client module that communicates with the backend REST API
- **Route_Guard**: A React component that enforces authentication and role-based access on routes
- **Permission_Gate**: A React component that conditionally renders UI elements based on the current user's role
- **Design_System**: The set of reusable UI components, tokens, and patterns following Material Design 3
- **Token**: The JWT string returned by the backend on successful login, valid for 24 hours
- **Admin**: A user with role `admin` — full read/write access to all modules
- **Teacher**: A user with role `teacher` — can mark attendance, enter/update marks, view timetable and students (read-only)
- **Session**: The authenticated state maintained in memory and persisted via secure storage
- **Toast_System**: The global notification component that displays transient feedback messages
- **Error_Boundary**: A React error boundary component that catches rendering errors and displays fallback UI
- **Skeleton_Loader**: A placeholder UI component shown while data is being fetched
- **Virtual_List**: A windowed list component that renders only visible rows for large datasets
- **Form_Validator**: The client-side validation layer applied to all data-entry forms
- **Breadcrumb**: A navigation component showing the current location within the app hierarchy
- **KPI_Card**: A dashboard widget displaying a single key performance indicator with label and value
- **Attendance_Grid**: The bulk attendance marking UI component showing all students in a class for a given date
- **Marks_Table**: The bulk marks entry UI component for entering exam results for all students
- **Timetable_Grid**: The weekly schedule grid component showing periods by day and time slot
- **Pretty_Printer**: A module that serializes structured data back to its canonical display format


## Requirements

---

### Requirement 1: Authentication & Session Security

**User Story:** As a school staff member, I want to securely log in and have my session managed automatically, so that my account is protected and I am not unexpectedly logged out mid-task.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Service SHALL store the JWT Token in `sessionStorage` (not `localStorage`) and redirect to the role-appropriate dashboard within 500ms of receiving the API response
2. WHEN a user submits invalid credentials, THE App SHALL display a non-revealing error message ("Invalid email or password") without exposing whether the email or password was incorrect
3. THE Auth_Service SHALL attach the JWT Token as a `Bearer` token in the `Authorization` header of every API_Client request
4. WHEN the App initialises, THE Auth_Service SHALL call `POST /api/v1/auth/verify` to validate the stored Token before rendering protected content
5. WHEN the Token verification call returns 401, THE Auth_Service SHALL clear the stored Token and redirect the user to the login page
6. WHEN the Token is within 5 minutes of its 24-hour expiry, THE App SHALL display a session timeout warning modal giving the user the option to extend or log out
7. WHEN the session timeout warning is dismissed without action and the Token expires, THE Auth_Service SHALL automatically clear the session and redirect to the login page with a "Session expired" message
8. WHEN a user clicks "Log Out", THE Auth_Service SHALL clear the Token from `sessionStorage`, cancel all pending API requests, and redirect to the login page
9. THE Auth_Service SHALL decode the Token payload client-side to extract `role`, `userId`, and `exp` without making an additional API call
10. IF the Token is malformed or cannot be decoded, THEN THE Auth_Service SHALL treat the session as invalid and redirect to the login page
11. THE App SHALL set the `autocomplete="current-password"` attribute on the password field and `autocomplete="email"` on the email field to support password managers
12. WHEN the login form is submitted, THE App SHALL disable the submit button and show a loading indicator until the API response is received
13. THE Auth_Service SHALL not expose the Token value in URL parameters, query strings, or console logs


---

### Requirement 2: Role-Based Access Control (RBAC)

**User Story:** As a system administrator, I want the UI to enforce role-based access so that teachers cannot access admin-only features and admins have full access.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any protected route, THE Route_Guard SHALL redirect to `/login` and preserve the originally requested path as a `redirect` query parameter
2. WHEN an authenticated user navigates to a route restricted to a role they do not hold, THE Route_Guard SHALL render a 403 Forbidden page with a "Return to Dashboard" action
3. THE Permission_Gate SHALL hide the "Add Student", "Edit Student", and "Delete Student" controls from Teacher role users
4. THE Permission_Gate SHALL hide all fee management write controls (create fee structure, record payment) from Teacher role users
5. THE Permission_Gate SHALL hide the "Create Exam" control from Teacher role users
6. THE Permission_Gate SHALL hide timetable create/edit/delete controls from Teacher role users
7. THE Permission_Gate SHALL hide the pending fees report and admin analytics sections from Teacher role users
8. WHEN a Teacher user attempts to access `/students/new`, `/fees/structures/new`, or any admin-only route directly via URL, THE Route_Guard SHALL redirect to the 403 page
9. THE App SHALL derive all permission checks from the `role` field in the decoded Token — no separate permission API call is required
10. WHEN the user's role changes (re-login with different account), THE App SHALL re-evaluate all Route_Guard and Permission_Gate instances immediately
11. THE App SHALL render navigation items conditionally: Teacher users SHALL NOT see "Fee Structures", "Pending Fees", or "Add Student" navigation links


---

### Requirement 3: Design System & UI Foundations

**User Story:** As a user, I want a consistent, polished interface that follows Material Design 3 principles, so that the application feels professional and is easy to use.

#### Acceptance Criteria

1. THE Design_System SHALL implement a Material Design 3 color scheme with a primary, secondary, tertiary, error, surface, and on-surface token set
2. THE Design_System SHALL support a light mode and a dark mode, toggled by user preference, with the selection persisted to `localStorage`
3. WHEN the operating system color scheme preference changes, THE App SHALL automatically switch between light and dark mode unless the user has explicitly set a preference
4. THE Design_System SHALL define a type scale with at least six levels: Display Large, Headline Medium, Title Large, Title Medium, Body Large, Body Medium, Label Large
5. THE Design_System SHALL define a spacing scale in multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64)
6. THE Design_System SHALL define elevation levels (0, 1, 2, 3, 4, 5) using box-shadow tokens consistent with Material Design 3 tonal surface elevation
7. THE Design_System SHALL define motion tokens: duration-short (100ms), duration-medium (250ms), duration-long (400ms) with easing curves (standard, emphasized, decelerate, accelerate)
8. THE Design_System SHALL define responsive breakpoints: compact (< 600px), medium (600–904px), expanded (≥ 905px)
9. WHILE in compact breakpoint, THE App SHALL render a bottom navigation bar instead of a side navigation rail
10. WHILE in medium breakpoint, THE App SHALL render a collapsed navigation rail with icons only
11. WHILE in expanded breakpoint, THE App SHALL render a full navigation drawer with icons and labels
12. THE Design_System SHALL provide the following base components: Button (filled, outlined, text, elevated, tonal), IconButton, TextField (outlined, filled), Select, Checkbox, Radio, Switch, Chip, Card, Dialog, Snackbar, Tooltip, Badge, Divider, Avatar, ProgressIndicator (linear, circular), DataTable, Tabs
13. ALL color combinations used in the Design_System SHALL meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text, 3:1 for large text)


---

### Requirement 4: Navigation & Layout

**User Story:** As a user, I want clear, role-aware navigation so that I can move between modules quickly and always know where I am in the application.

#### Acceptance Criteria

1. THE App SHALL render a persistent top app bar displaying the Tensor logo, current page title, a theme toggle button, and the logged-in user's avatar with a dropdown menu (Profile, Logout)
2. THE App SHALL render a navigation component (drawer/rail/bottom bar per breakpoint) with the following items visible to all roles: Dashboard, Students, Attendance, Exams, Timetable
3. THE App SHALL render the following navigation items visible to Admin role only: Fee Structures, Payments, Pending Fees
4. THE App SHALL highlight the active navigation item with the primary color and a filled indicator
5. THE App SHALL render a Breadcrumb component below the top app bar showing the full path to the current page (e.g., "Dashboard > Students > Edit Student")
6. WHEN a navigation item is clicked, THE App SHALL navigate to the target route and update the Breadcrumb within 100ms
7. WHILE in compact breakpoint, THE App SHALL render a hamburger menu icon in the top app bar that opens a modal navigation drawer
8. THE App SHALL support keyboard navigation through all navigation items using Tab and Enter keys
9. WHEN the user navigates away from a form with unsaved changes, THE App SHALL display a confirmation dialog before proceeding


---

### Requirement 5: Dashboard

**User Story:** As a user, I want a role-specific dashboard with key metrics and quick actions, so that I can get an overview of the school's status at a glance.

#### Acceptance Criteria

1. WHEN an Admin user lands on the dashboard, THE App SHALL display KPI_Cards for: Total Students, Total Teachers, Attendance Rate Today (%), Pending Fees Count, and Upcoming Exams Count
2. WHEN a Teacher user lands on the dashboard, THE App SHALL display KPI_Cards for: Classes Assigned, Attendance Marked Today (count), Upcoming Exams, and Recent Marks Entries
3. THE App SHALL render an attendance trend chart (line chart) showing daily attendance percentage for the past 30 days on the Admin dashboard
4. THE App SHALL render a fee collection summary chart (bar chart) showing monthly collections for the current academic year on the Admin dashboard
5. THE App SHALL render a "Recent Activity" list showing the last 10 audit events (student added, payment recorded, marks entered) on the Admin dashboard
6. THE App SHALL render a "Quick Actions" section with buttons: Add Student, Mark Attendance, Record Payment (Admin); Mark Attendance, Enter Marks (Teacher)
7. WHEN dashboard data is loading, THE App SHALL display Skeleton_Loader placeholders for each KPI_Card and chart
8. WHEN a KPI_Card is clicked, THE App SHALL navigate to the corresponding module page
9. THE App SHALL refresh dashboard data every 5 minutes while the page is active, without a full page reload
10. IF the dashboard data fetch fails, THEN THE App SHALL display an error state with a "Retry" button on each failed widget independently


---

### Requirement 6: Student Management

**User Story:** As an admin, I want to manage student records with full CRUD operations, and as a teacher, I want to view student information, so that student data is always accurate and accessible.

#### Acceptance Criteria

1. THE App SHALL display a paginated student list fetched from `GET /api/v1/students` with columns: Admission No, Full Name, Class, Section, Gender, Status (Active/Inactive)
2. THE App SHALL support client-side search filtering the student list by name or admission number with results updating within 300ms of the last keystroke (debounced)
3. THE App SHALL support filtering the student list by class, section, gender, and active status via a filter panel
4. THE App SHALL support sorting the student list by name (A–Z, Z–A), admission number, and admission date
5. THE App SHALL display 20 students per page by default with a page size selector offering 10, 20, 50, 100 options
6. WHEN the student list contains more than 200 records, THE App SHALL use a Virtual_List to render only visible rows
7. WHEN an Admin user clicks "Add Student", THE App SHALL render a multi-step form with steps: Personal Info, Contact & Address, Academic Info, Parent/Guardian Info
8. THE Form_Validator SHALL validate the student form: admission_no (required, unique format), first_name and last_name (required, 2–100 chars), date_of_birth (required, must be in the past, student must be between 3 and 25 years old), gender (required, one of male/female/other), class_id and section_id (required), admission_date (required, not in the future), parent_name (required), parent_phone (required, 10–15 digits)
9. WHEN an Admin user submits a valid student creation form, THE App SHALL call `POST /api/v1/students`, display a success toast, and redirect to the new student's profile page
10. WHEN an Admin user submits a student form with validation errors, THE App SHALL display inline error messages below each invalid field without submitting the form
11. THE App SHALL render a student profile page at `/students/:id` showing all student fields, attendance summary (present/absent/late counts), fee payment history, and exam results
12. WHEN an Admin user clicks "Edit" on a student profile, THE App SHALL render the edit form pre-populated with existing values
13. WHEN an Admin user clicks "Delete" on a student record, THE App SHALL display a confirmation dialog requiring the user to type the student's admission number before confirming deletion
14. THE App SHALL support bulk selection of students via checkboxes and provide a bulk action menu with: Export Selected (CSV), Deactivate Selected (Admin only)
15. WHEN the student list is empty after filtering, THE App SHALL display an empty state illustration with the message "No students match your filters" and a "Clear Filters" button
16. IF the student list fetch fails, THEN THE App SHALL display an error state with a "Retry" button


---

### Requirement 7: Attendance Management

**User Story:** As a teacher or admin, I want to mark and review attendance efficiently, so that accurate daily attendance records are maintained for all students.

#### Acceptance Criteria

1. THE App SHALL render an attendance marking page where the user selects a class, section, and date before the Attendance_Grid is displayed
2. WHEN a class, section, and date are selected, THE App SHALL fetch existing attendance records from `GET /api/v1/attendance/class` and pre-populate the Attendance_Grid
3. THE Attendance_Grid SHALL display all active students in the selected class/section with their name, admission number, and a status selector (Present, Absent, Late, Excused) per row
4. THE Attendance_Grid SHALL support a "Mark All Present" bulk action that sets all students to Present in a single interaction
5. WHEN the user submits the Attendance_Grid, THE App SHALL call `POST /api/v1/attendance` for new records and display a success toast with the count of records saved
6. WHEN attendance for a date has already been marked, THE App SHALL display the existing records in the Attendance_Grid and allow editing, calling the appropriate update endpoint
7. THE App SHALL render an attendance calendar view for individual students at `/attendance/student/:id` showing a monthly calendar with color-coded dates (green = present, red = absent, yellow = late, grey = excused)
8. THE App SHALL render an attendance statistics panel showing: total school days, present count, absent count, late count, attendance percentage — for a selected date range
9. THE App SHALL support date range filtering on the attendance statistics view with a date picker (start date, end date)
10. WHEN the selected date is a future date, THE App SHALL disable the attendance submission and display a "Cannot mark attendance for future dates" message
11. WHEN the selected date is today, THE App SHALL highlight the date selector with a "Today" badge
12. IF the attendance fetch fails, THEN THE App SHALL display an error state and allow the user to retry without losing their class/section/date selection
13. THE App SHALL display attendance status with both color and icon indicators (not color alone) to support color-blind users


---

### Requirement 8: Fee Management

**User Story:** As an admin, I want to define fee structures, record payments, and track pending dues, so that the school's financial records are accurate and up to date.

#### Acceptance Criteria

1. THE App SHALL render a fee structures list page fetched from `GET /api/v1/fees/structures` showing class, academic year, tuition fee, transport fee, activity fee, other fee, and total fee
2. WHEN an Admin user clicks "Add Fee Structure", THE App SHALL render a form with fields: class (required, dropdown), academic_year (required, format YYYY-YYYY), tuition_fee (required, positive decimal), transport_fee (optional, non-negative decimal), activity_fee (optional, non-negative decimal), other_fee (optional, non-negative decimal)
3. THE Form_Validator SHALL validate that the total_fee displayed equals the sum of tuition_fee + transport_fee + activity_fee + other_fee in real time as the user types
4. WHEN an Admin user submits a valid fee structure form, THE App SHALL call `POST /api/v1/fees/structures`, display a success toast, and refresh the fee structures list
5. THE App SHALL render a payment recording form accessible from the student profile page and the payments list, with fields: student (required, searchable dropdown), academic_year (required), amount (required, positive decimal, must not exceed outstanding balance), payment_date (required, not in the future), payment_method (required, one of cash/card/bank_transfer/cheque/online), transaction_id (optional), remarks (optional)
6. WHEN an Admin user submits a valid payment form, THE App SHALL call `POST /api/v1/fees/payments`, display a success toast with the payment receipt summary, and update the student's fee status
7. THE App SHALL render a student fee status page at `/fees/student/:id` showing: fee structure for the student's class, total paid, outstanding balance, and a chronological payment history table
8. THE App SHALL render a pending fees report page at `/fees/pending` (Admin only) fetched from `GET /api/v1/fees/pending`, showing students with outstanding balances, sortable by amount due and student name
9. THE App SHALL display outstanding balance with a color indicator: green (fully paid), amber (partially paid), red (no payment recorded)
10. THE App SHALL support exporting the pending fees report as a CSV file client-side
11. IF a fee structure does not exist for a student's class and academic year, THEN THE App SHALL display a warning banner on the student fee status page with a link to create the fee structure
12. THE Form_Validator SHALL reject payment amounts of zero or negative values with the message "Amount must be greater than zero"


---

### Requirement 9: Exam Management

**User Story:** As an admin, I want to create exams and manage marks, and as a teacher, I want to enter and update student marks, so that exam results are recorded accurately.

#### Acceptance Criteria

1. THE App SHALL render an exams list page showing all exams with columns: name, exam type, class, subject, max marks, passing marks, exam date
2. WHEN an Admin user clicks "Create Exam", THE App SHALL render a form with fields: name (required, 3–200 chars), exam_type (required, one of unit_test/mid_term/final/practical), class_id (required, dropdown), subject (required, 2–100 chars), max_marks (required, positive integer), passing_marks (required, positive integer, must be ≤ max_marks), exam_date (required)
3. THE Form_Validator SHALL validate that passing_marks is less than or equal to max_marks in real time
4. WHEN an Admin user submits a valid exam creation form, THE App SHALL call `POST /api/v1/exams`, display a success toast, and navigate to the exam's marks entry page
5. THE App SHALL render a Marks_Table for each exam showing all students in the exam's class with columns: student name, admission number, marks obtained (editable input), absent toggle, remarks (optional)
6. THE Marks_Table SHALL validate each marks_obtained entry: must be a non-negative number, must not exceed max_marks for the exam, must be empty or 0 when the absent toggle is checked
7. WHEN a user submits the Marks_Table, THE App SHALL call `POST /api/v1/exams/:id/marks` for new entries and `PUT /api/v1/marks/:id` for updates, batching requests where possible
8. THE App SHALL display a per-student pass/fail indicator in the Marks_Table based on whether marks_obtained ≥ passing_marks
9. THE App SHALL render a class results page at `/exams/:id/results` showing: class average, highest marks, lowest marks, pass count, fail count, pass percentage, and a marks distribution histogram
10. THE App SHALL render a student results page at `/exams/student/:id` showing all exams the student has participated in with their marks, grade, and pass/fail status
11. THE App SHALL calculate and display a letter grade alongside marks: A (≥ 90%), B (≥ 75%), C (≥ 60%), D (≥ 45%), F (< 45%) based on percentage of max_marks
12. WHEN marks are edited after initial entry, THE App SHALL display a visual "edited" indicator on the row and include the edit timestamp in the remarks field
13. THE App SHALL support filtering the exams list by class, exam type, and date range


---

### Requirement 10: Timetable Management

**User Story:** As an admin, I want to create and manage the weekly timetable, and as a teacher, I want to view my assigned schedule, so that classes are organized and conflicts are avoided.

#### Acceptance Criteria

1. THE App SHALL render a Timetable_Grid as a weekly table with days of the week (Monday–Saturday) as columns and period numbers as rows, showing subject, teacher, and room for each cell
2. THE App SHALL support filtering the Timetable_Grid by class and section via a selector at the top of the page
3. WHEN an Admin user clicks an empty cell in the Timetable_Grid, THE App SHALL open a dialog form with fields: subject (required), teacher_id (required, dropdown of teachers), room_number (optional), start_time (required), end_time (required, must be after start_time)
4. THE Form_Validator SHALL validate that end_time is strictly after start_time
5. WHEN an Admin user submits a valid timetable entry form, THE App SHALL call `POST /api/v1/timetable`, close the dialog, and update the Timetable_Grid cell without a full page reload
6. WHEN an Admin user clicks an existing cell in the Timetable_Grid, THE App SHALL open the edit dialog pre-populated with the existing entry's values
7. WHEN an Admin user clicks "Delete" in the timetable entry dialog, THE App SHALL display a confirmation prompt and call `DELETE /api/v1/timetable/:id` on confirmation
8. THE App SHALL render a teacher timetable view at `/timetable/teacher/:id` showing only the periods assigned to that teacher across all classes
9. WHEN a Teacher user views the timetable, THE App SHALL default to showing their own timetable (filtered by their user ID)
10. THE App SHALL highlight the current day's column in the Timetable_Grid with the primary color tint
11. IF a timetable entry's time slot overlaps with an existing entry for the same class/section/day, THEN THE App SHALL display a conflict warning in the form before submission


---

### Requirement 11: Forms & Validation

**User Story:** As a user, I want clear, real-time form validation with helpful error messages, so that I can correct mistakes before submitting data.

#### Acceptance Criteria

1. THE Form_Validator SHALL validate required fields on blur (when the field loses focus) and display an inline error message below the field
2. THE Form_Validator SHALL re-validate all fields on form submission and prevent submission if any field is invalid
3. THE Form_Validator SHALL display error messages in the error color token with an error icon, and success state with a checkmark icon for validated fields
4. WHEN a field error is corrected, THE Form_Validator SHALL clear the error message within 100ms of the correction
5. THE App SHALL disable the form submit button while a submission is in progress and show a circular progress indicator inside the button
6. WHEN a form submission succeeds, THE App SHALL display a success toast notification and either reset the form or navigate away as appropriate to the context
7. WHEN a form submission fails due to a network error, THE App SHALL display an error toast with a "Retry" action and re-enable the submit button
8. WHEN a form submission fails due to a 422 validation error from the API, THE App SHALL map the API error fields to the corresponding form fields and display server-side error messages inline
9. THE App SHALL support optimistic updates for attendance marking: the UI SHALL update immediately and roll back with an error toast if the API call fails
10. THE Form_Validator SHALL validate date fields to ensure dates are within realistic ranges (not before year 1900, not after year 2100)
11. THE App SHALL preserve form state (unsaved values) if the user accidentally navigates away and returns via the browser back button within the same session
12. FOR ALL form fields, the Pretty_Printer SHALL format displayed values consistently: dates as DD/MM/YYYY in display mode and YYYY-MM-DD in API payloads, currency as locale-formatted decimal with 2 decimal places


---

### Requirement 12: Error Handling & User Feedback

**User Story:** As a user, I want clear feedback for all actions and graceful handling of errors, so that I always know what is happening and can recover from failures.

#### Acceptance Criteria

1. THE Toast_System SHALL display transient notifications in the bottom-right corner of the screen with variants: success (green), error (red), warning (amber), info (blue)
2. THE Toast_System SHALL auto-dismiss success and info toasts after 4 seconds and keep error and warning toasts until manually dismissed
3. THE Toast_System SHALL support stacking up to 3 simultaneous toasts, queuing additional toasts
4. THE Error_Boundary SHALL wrap each major page section independently so that a rendering error in one section does not crash the entire page
5. WHEN the Error_Boundary catches an error, THE App SHALL display a fallback UI with the message "Something went wrong" and a "Reload Section" button
6. WHEN an API call returns 401, THE API_Client SHALL automatically clear the session and redirect to the login page with a "Session expired" toast
7. WHEN an API call returns 403, THE API_Client SHALL display an error toast "You don't have permission to perform this action" without redirecting
8. WHEN an API call returns 404, THE App SHALL display a "Not Found" page with a "Go Back" button
9. WHEN an API call returns 500 or a network error occurs, THE API_Client SHALL display an error toast with the message "Server error. Please try again." and log the error details to the console in development mode only
10. THE App SHALL implement automatic retry with exponential backoff (1s, 2s, 4s) for failed GET requests, up to 3 attempts, before showing the error state
11. THE App SHALL display empty state components (illustration + message + action button) for all list pages when no data is returned
12. WHEN the browser goes offline, THE App SHALL display a persistent "No internet connection" banner at the top of the page and disable all form submissions


---

### Requirement 13: Performance

**User Story:** As a user, I want the application to load quickly and remain responsive even with large datasets, so that my workflow is not interrupted by slow performance.

#### Acceptance Criteria

1. THE App SHALL implement route-based code splitting using React.lazy and Suspense so that each page module is loaded on demand
2. THE App SHALL achieve a Largest Contentful Paint (LCP) of under 2.5 seconds on a simulated 4G connection for the login and dashboard pages
3. THE App SHALL display Skeleton_Loader components within 100ms of initiating a data fetch, before the API response is received
4. THE App SHALL cache API responses for read-only data (classes, sections, fee structures) in memory for the duration of the session, invalidating on write operations
5. THE App SHALL use a Virtual_List for any list exceeding 100 items, rendering only the visible rows plus a 10-row overscan buffer
6. THE App SHALL debounce search input handlers with a 300ms delay before triggering API calls or client-side filtering
7. THE App SHALL throttle dashboard auto-refresh to no more than once every 5 minutes
8. THE App SHALL lazy-load chart components (attendance trend, fee collection) only when the dashboard is first rendered
9. THE App SHALL preload the dashboard route assets after the login page has fully loaded (using `<link rel="prefetch">` or equivalent)
10. THE App SHALL not block the main thread for more than 50ms during any user interaction (measured by Total Blocking Time)
11. THE App SHALL implement pagination on all list views and SHALL NOT fetch more than 100 records in a single API call
12. WHEN a page is navigated away from and back to, THE App SHALL restore the previous scroll position and filter/sort state from session state


---

### Requirement 14: Accessibility

**User Story:** As a user with accessibility needs, I want the application to be fully navigable by keyboard and compatible with screen readers, so that I can use all features regardless of my abilities.

#### Acceptance Criteria

1. THE App SHALL ensure all interactive elements (buttons, links, inputs, selects) are reachable and operable via keyboard using Tab, Shift+Tab, Enter, Space, and arrow keys
2. THE App SHALL manage focus correctly: WHEN a dialog opens, focus SHALL move to the first focusable element inside the dialog; WHEN a dialog closes, focus SHALL return to the element that triggered it
3. THE App SHALL provide descriptive `aria-label` or `aria-labelledby` attributes on all icon-only buttons (e.g., edit, delete, close icons)
4. THE App SHALL use semantic HTML elements: `<nav>` for navigation, `<main>` for page content, `<header>` for the top app bar, `<table>` for data tables, `<form>` for forms
5. THE App SHALL associate all form inputs with their labels using `htmlFor`/`id` pairs or `aria-labelledby`
6. THE App SHALL provide `aria-describedby` linking form inputs to their error messages when validation errors are present
7. THE App SHALL announce dynamic content changes (toast notifications, loading states, form errors) using `aria-live` regions with appropriate politeness levels
8. THE App SHALL provide visible focus indicators on all interactive elements with a minimum 2px outline in a color that meets 3:1 contrast ratio against the background
9. THE App SHALL not rely solely on color to convey information — all status indicators SHALL include text labels or icons in addition to color
10. THE App SHALL support text scaling up to 200% without horizontal scrolling or loss of content on expanded breakpoint
11. THE App SHALL provide `alt` text for all meaningful images and `alt=""` for decorative images
12. THE Timetable_Grid and Attendance_Grid SHALL be navigable by keyboard with arrow keys moving between cells and Enter/Space activating cell actions


---

### Requirement 15: Security

**User Story:** As a security engineer, I want the frontend to follow security best practices, so that user data and sessions are protected from common web vulnerabilities.

#### Acceptance Criteria

1. THE App SHALL store the JWT Token exclusively in `sessionStorage` and SHALL NOT store it in `localStorage`, cookies, or URL parameters
2. THE App SHALL sanitize all user-supplied string values before rendering them in the DOM using a library such as DOMPurify, preventing XSS injection
3. THE App SHALL not use `dangerouslySetInnerHTML` with unsanitized user input anywhere in the codebase
4. THE API_Client SHALL include a `Content-Type: application/json` header on all POST/PUT requests and SHALL NOT include the Token in query parameters
5. THE App SHALL implement a Content Security Policy (CSP) meta tag restricting script sources to `'self'` and the application's own domain
6. THE App SHALL not log sensitive data (Token value, passwords, personal student data) to the browser console in production builds
7. WHEN an API error response is received, THE App SHALL display a generic user-facing message and SHALL NOT render raw API error details or stack traces in the UI
8. THE App SHALL validate all route parameters (`:id` fields) to be positive integers before making API calls, displaying a 404 page for invalid parameter formats
9. THE Form_Validator SHALL strip leading and trailing whitespace from all text inputs before validation and submission
10. THE App SHALL set `rel="noopener noreferrer"` on all external links
11. THE App SHALL not expose the backend API base URL in client-side error messages shown to users
12. WHEN the user's session is cleared (logout or expiry), THE App SHALL call `sessionStorage.clear()` to remove all session data


---

### Requirement 16: Testing

**User Story:** As a developer, I want a comprehensive test suite covering unit, integration, and property-based tests, so that regressions are caught early and the codebase remains reliable.

#### Acceptance Criteria

1. THE App SHALL include unit tests for all Form_Validator functions achieving 100% branch coverage on validation logic
2. THE App SHALL include unit tests for the Auth_Service covering: token storage, token decoding, expiry detection, session clearing, and role extraction
3. THE App SHALL include unit tests for the API_Client covering: request header injection, 401 interception, 403 handling, retry logic, and error formatting
4. THE App SHALL include integration tests for the following user flows using a mocked API: login success, login failure, student list load, student create, attendance mark, payment record, marks entry
5. THE App SHALL include integration tests for all Route_Guard scenarios: unauthenticated redirect, teacher accessing admin route, admin accessing all routes
6. THE App SHALL include property-based tests for the Form_Validator using a library such as fast-check, covering: FOR ALL strings with length < 2, name validation SHALL return an error; FOR ALL strings with length between 2 and 100, name validation SHALL return no error; FOR ALL non-positive numbers, amount validation SHALL return an error; FOR ALL positive numbers, amount validation SHALL return no error
7. THE App SHALL include a property-based test for date formatting: FOR ALL valid Date objects, Pretty_Printer.formatDate(date) parsed back to a Date SHALL produce an equivalent date (round-trip property)
8. THE App SHALL include a property-based test for currency formatting: FOR ALL non-negative numbers, Pretty_Printer.formatCurrency(n) SHALL produce a string that when parsed back to a number equals the original value (round-trip property)
9. THE App SHALL include snapshot tests for all Design_System base components to detect unintended visual regressions
10. THE App SHALL achieve a minimum of 80% line coverage across all source files excluding generated code and type definitions
11. THE App SHALL include end-to-end tests for the critical paths: login → dashboard, add student, mark attendance, record payment, enter marks
12. THE App SHALL run all unit and integration tests in under 60 seconds in CI


---

### Requirement 17: Build & Deployment

**User Story:** As a DevOps engineer, I want a production-optimized build with environment configuration and error monitoring, so that the application is reliable and debuggable in production.

#### Acceptance Criteria

1. THE App SHALL use Vite's build system and produce a production bundle with tree-shaking, minification, and chunk splitting
2. THE App SHALL read all environment-specific values (API base URL, environment name) from `.env` files using the `VITE_` prefix convention
3. WHEN a required environment variable (e.g., `VITE_API_BASE_URL`) is missing at build time, THE build process SHALL fail with a descriptive error message
4. THE App SHALL produce separate chunks for: vendor libraries, Design_System components, and each route module — with each chunk not exceeding 250KB gzipped
5. THE App SHALL include source maps in production builds for error monitoring purposes, stored separately and not served to end users
6. THE App SHALL integrate an error monitoring solution (e.g., Sentry) that captures unhandled JavaScript errors and promise rejections in production
7. WHEN an unhandled error is captured, THE error monitoring solution SHALL include the user's role (not their ID or personal data) and the current route as context
8. THE App SHALL define a `Content-Security-Policy` header in the deployment configuration restricting `script-src` to `'self'`
9. THE App SHALL configure cache headers so that hashed asset files (JS, CSS) are cached for 1 year and `index.html` is not cached (Cache-Control: no-cache)
10. THE App SHALL pass a Lighthouse performance audit with scores ≥ 90 for Performance, Accessibility, and Best Practices on the login and dashboard pages
11. THE App SHALL support deployment to Vercel or Netlify with a single configuration file (`vercel.json` or `netlify.toml`) that handles SPA routing (redirect all paths to `index.html`)
12. THE App SHALL define separate `.env.development` and `.env.production` files with appropriate defaults, and SHALL NOT commit secrets to version control


---

### Requirement 18: API Client & Data Serialization

**User Story:** As a developer, I want a consistent, well-typed API client layer with predictable serialization, so that all data exchange with the backend is reliable and type-safe.

#### Acceptance Criteria

1. THE API_Client SHALL be implemented as a typed Axios instance with base URL, default headers, and interceptors configured in a single module
2. THE API_Client SHALL use request interceptors to inject the `Authorization: Bearer <token>` header on every outgoing request
3. THE API_Client SHALL use response interceptors to normalize all API responses to a consistent shape: `{ data, error, status }`
4. THE API_Client SHALL parse all date strings from API responses into JavaScript `Date` objects automatically
5. THE Pretty_Printer SHALL serialize all `Date` objects to ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`) before sending to the API
6. FOR ALL valid API response objects, deserializing then re-serializing SHALL produce an equivalent JSON string (round-trip property)
7. THE API_Client SHALL define TypeScript interfaces for all request and response payloads matching the backend schema
8. THE API_Client SHALL handle API pagination by providing a typed `fetchPaginated<T>` helper that accepts page and limit parameters and returns `{ items: T[], total: number, page: number, totalPages: number }`
9. WHEN the API returns an error response, THE API_Client SHALL extract the error message from the response body and throw a typed `ApiError` with `status`, `message`, and `code` fields
10. THE API_Client SHALL support request cancellation via `AbortController` so that navigating away from a page cancels in-flight requests for that page


---

### Requirement 19: State Management

**User Story:** As a developer, I want a predictable, maintainable state management approach, so that application state is consistent across components and easy to debug.

#### Acceptance Criteria

1. THE App SHALL use React Context for global state that is needed across the entire application: authentication state, theme preference, and toast notifications
2. THE App SHALL use local component state (useState/useReducer) for UI state that is not shared across routes
3. THE App SHALL use a server state management library (e.g., TanStack Query) for all API data fetching, caching, and synchronization
4. WHEN a write operation (POST/PUT/DELETE) succeeds, THE App SHALL invalidate the relevant query cache entries so that subsequent reads reflect the updated data
5. THE App SHALL not store API response data in global Context — all server state SHALL be managed by the server state library
6. THE App SHALL define custom hooks (e.g., `useStudents`, `useAttendance`, `useExams`) that encapsulate data fetching logic and expose loading, error, and data states
7. WHEN the same data is requested by multiple components on the same page, THE server state library SHALL deduplicate the API call and share the result
8. THE App SHALL persist only the following state to `sessionStorage`: JWT Token, theme preference (to `localStorage`), and active filter/sort state per page


---

### Requirement 20: Correctness Properties for Property-Based Testing

**User Story:** As a developer, I want formally specified correctness properties for the most critical frontend logic, so that property-based tests can verify invariants across arbitrary inputs.

#### Acceptance Criteria

1. THE Form_Validator SHALL satisfy the idempotence property: FOR ALL input values `v`, `validate(validate(v)) === validate(v)` — running validation twice produces the same result as running it once
2. THE Pretty_Printer SHALL satisfy the round-trip property for dates: FOR ALL valid ISO date strings `s`, `formatDate(parseDate(s))` SHALL produce a string that when parsed again equals the original date value
3. THE Pretty_Printer SHALL satisfy the round-trip property for currency: FOR ALL non-negative numbers `n` with at most 2 decimal places, `parseCurrency(formatCurrency(n)) === n`
4. THE API_Client serializer SHALL satisfy the round-trip property: FOR ALL valid API response objects `r`, `deserialize(serialize(r))` SHALL produce an object deeply equal to `r`
5. THE Auth_Service token decoder SHALL satisfy the invariant: FOR ALL valid JWT strings `t`, `decodeToken(t).exp` SHALL be a number greater than the token's issued-at time `iat`
6. THE grade calculator SHALL satisfy the metamorphic property: FOR ALL marks values `a` and `b` where `a > b`, `calculateGrade(a, maxMarks) >= calculateGrade(b, maxMarks)` — higher marks SHALL never produce a lower grade
7. THE attendance percentage calculator SHALL satisfy the invariant: FOR ALL attendance records, `attendancePercentage` SHALL be a number in the range [0, 100] inclusive
8. THE pagination helper SHALL satisfy the invariant: FOR ALL responses with `total` items and `pageSize` per page, `totalPages === Math.ceil(total / pageSize)` and the number of items on the last page SHALL be `total % pageSize` (or `pageSize` if evenly divisible)
9. THE fee outstanding balance calculator SHALL satisfy the invariant: FOR ALL students, `outstandingBalance === totalFee - totalPaid` and `outstandingBalance >= 0` (payments cannot exceed the fee structure total)
10. THE Form_Validator name validator SHALL satisfy the metamorphic property: FOR ALL strings `s` where `s.trim().length >= 2 && s.trim().length <= 100`, the validator SHALL return valid regardless of leading/trailing whitespace

