# 🏗️ Tensor – System Architecture

## 📌 Overview

Tensor is a web-based School ERP system built using a modern client-server architecture.
It follows a **RESTful API architecture** with a scalable backend and cloud-managed database.

---

# 🧱 High-Level Architecture

```
Frontend (React)
        ↓
API Layer (Node.js + Express)
        ↓
Database Layer (Supabase - PostgreSQL)
        ↓
Storage & Services (Supabase Storage / Auth - optional)
```

---

# 🟢 1. Frontend Layer

## Technology

* React.js
* Tailwind CSS
* Axios

## Responsibilities

* User Interface (Admin / Teacher dashboards)
* Form handling (students, fees, exams)
* API communication with backend
* State management (local or context)

---

# 🟡 2. Backend Layer (Core System)

## Technology

* Node.js
* Express.js

## Responsibilities

* API creation (REST endpoints)
* Business logic processing
* Authentication & authorization (JWT)
* Data validation
* Communication with Supabase DB

---

## 📁 Backend Architecture

```
backend/
│
├── controllers/      # Business logic
├── routes/           # API endpoints
├── middleware/       # Auth, error handling
├── services/         # DB queries (Supabase)
├── config/           # DB connection
├── utils/            # Helpers
│
├── server.js
└── .env
```

---

# 🔵 3. Database Layer (Supabase)

## Technology

* Supabase (PostgreSQL)

## Responsibilities

* Store all structured data
* Manage relationships between entities
* Provide secure access via API keys

---

## 🗄️ Core Database Tables

### 👤 Users

* id (PK)
* email
* password (hashed)
* role (admin / teacher)

---

### 🎓 Students

* id (PK)
* admission_no (unique)
* name
* dob
* gender
* class_id
* section_id
* parent_id

---

### 👪 Parents

* id (PK)
* name
* phone

---

### 🏫 Classes

* id (PK)
* name

---

### 📚 Sections

* id (PK)
* class_id (FK)
* name

---

### 📅 Attendance

* id (PK)
* student_id (FK)
* date
* status

---

### 💰 Fees

* id (PK)
* class_id (FK)
* amount

---

### 💳 Payments

* id (PK)
* student_id (FK)
* amount
* date
* status

---

### 📝 Exams

* id (PK)
* name
* date

---

### 📊 Marks

* id (PK)
* student_id (FK)
* exam_id (FK)
* subject
* marks

---

### 🕒 Timetable

* id (PK)
* class_id (FK)
* section_id (FK)
* subject
* teacher_id
* day
* time

---

# 🔐 4. Authentication Flow

## Option A (Recommended)

* Use JWT (custom auth)

## Flow:

1. User logs in
2. Backend verifies credentials
3. JWT token generated
4. Token sent to frontend
5. Protected routes verify token

---

## Option B (Alternative)

* Use Supabase Auth (optional)

---

# 🔄 API Flow

```
Client Request
     ↓
Route (Express)
     ↓
Controller
     ↓
Service (DB Query)
     ↓
Supabase (PostgreSQL)
     ↓
Response (JSON)
```

---

# ⚙️ Example API Flow

## Create Student

```
POST /api/students
```

Flow:

* Validate request
* Insert into DB
* Return success response

---

# 🧠 Key Design Principles

* Modular architecture
* Separation of concerns
* Scalable database design
* RESTful API structure
* Secure authentication

---

# 🚀 Scalability (Future Ready)

Tensor architecture supports:

* Multi-school support
* Mobile app integration
* AI/analytics layer
* Real-time notifications
* Microservices (future upgrade)

---

# ☁️ Deployment Architecture

## Frontend

* Vercel / Netlify

## Backend

* Render / Railway / AWS

## Database

* Supabase (PostgreSQL cloud)

---

# 🔐 Security Considerations

* Password hashing (bcrypt)
* JWT authentication
* Role-based access control
* Environment variables for secrets

---

# 📌 Conclusion

This architecture ensures that Tensor is:

* Scalable
* Maintainable
* Production-ready
* Easy to extend with advanced features

---
