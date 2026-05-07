# Supabase Setup Guide

**Status**: ✅ Supabase is now active and working!

---

## Step 1: Run Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rirclhnsmxwfbvzftqjj`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `backend/src/database/schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

**Expected Result**: All 11 tables created with indexes and triggers

---

## Step 2: Run Seed Data

1. In the same SQL Editor, click **New Query**
2. Copy the entire contents of `backend/src/database/seed.sql`
3. Paste into the SQL Editor
4. Click **Run**

**Expected Result**: 
- 1 admin user created
- 13 classes created (Nursery to Class 10)
- 52 sections created (A, B, C, D for each class)

---

## Step 3: Verify Database Setup

Run this query in SQL Editor to verify:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check admin user
SELECT id, email, role, first_name, last_name 
FROM users;

-- Check classes
SELECT id, name FROM classes ORDER BY id;

-- Check sections count
SELECT COUNT(*) as section_count FROM sections;
```

**Expected Results**:
- 11 tables listed
- 1 admin user: admin@tensorschool.com
- 13 classes
- 52 sections

---

## Step 4: Test Backend Connection

Now let's test if the backend can connect to Supabase:

```bash
cd backend
npm run dev
```

**Expected Output**:
```
Server running on port 5000
Database connection: healthy
```

---

## Step 5: Test API Endpoints

### Test Health Check
```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-06T...",
  "database": "connected"
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tensorschool.com",
    "password": "Admin@123"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@tensorschool.com",
      "role": "admin",
      "firstName": "System",
      "lastName": "Admin"
    }
  },
  "message": "Login successful"
}
```

---

## Step 6: Test Frontend

1. Start the frontend:
```bash
cd frontend
npm run dev
```

2. Open browser: http://localhost:5173

3. Login with:
   - Email: `admin@tensorschool.com`
   - Password: `Admin@123`

4. You should see the dashboard with KPI cards!

---

## Default Credentials

**Admin User**:
- Email: `admin@tensorschool.com`
- Password: `Admin@123`
- Role: `admin`

**Note**: Change this password in production!

---

## Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run schema.sql again in Supabase SQL Editor

### Issue: "duplicate key value violates unique constraint"
**Solution**: Tables already exist. You can either:
- Drop all tables and re-run schema.sql
- Or skip this error (data already exists)

### Issue: Backend can't connect to Supabase
**Solution**: 
1. Check `.env` file has correct credentials
2. Verify Supabase project is not paused
3. Check network connectivity

### Issue: Login fails with "Invalid credentials"
**Solution**: 
1. Verify seed.sql was run successfully
2. Check if user exists: `SELECT * FROM users;`
3. Password is case-sensitive: `Admin@123`

---

## Next Steps After Setup

Once everything is working:

1. ✅ Test all API endpoints (use Swagger at `/api-docs`)
2. ✅ Test all frontend pages
3. ✅ Create a few test students
4. ✅ Mark attendance
5. ✅ Create fee structures
6. ✅ Create exams and enter marks
7. ✅ View dashboard analytics

---

## Quick Test Checklist

- [ ] Schema.sql executed successfully
- [ ] Seed.sql executed successfully
- [ ] 11 tables created
- [ ] Admin user exists
- [ ] 13 classes created
- [ ] 52 sections created
- [ ] Backend starts without errors
- [ ] Health check returns "healthy"
- [ ] Login API works
- [ ] Frontend loads
- [ ] Can login to frontend
- [ ] Dashboard shows KPI cards

---

**Ready to proceed!** Follow the steps above and let me know if you encounter any issues.
