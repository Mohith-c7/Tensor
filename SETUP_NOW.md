# 🚀 Quick Setup Instructions

**Your Supabase is now active! Follow these 3 simple steps:**

---

## Step 1: Run Database Setup (2 minutes)

1. Go to: https://supabase.com/dashboard/project/rirclhnsmxwfbvzftqjj
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file: `backend/src/database/complete-setup.sql`
5. Copy ALL the contents (Ctrl+A, Ctrl+C)
6. Paste into Supabase SQL Editor (Ctrl+V)
7. Click **Run** button (or press Ctrl+Enter)

**Expected Result**: 
```
Success. No rows returned
```

This creates:
- ✅ 15 tables (11 main + 4 auth tables)
- ✅ All indexes and triggers
- ✅ 1 admin user
- ✅ 13 classes
- ✅ 52 sections

---

## Step 2: Verify Database (30 seconds)

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if everything is set up
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM classes) as class_count,
  (SELECT COUNT(*) FROM sections) as section_count;
```

**Expected Result**:
```
table_count: 15
user_count: 1
class_count: 13
section_count: 52
```

---

## Step 3: Test Login (30 seconds)

The backend is already running! Test the login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d @test-login.json
```

Or use this PowerShell command:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@tensorschool.com","password":"Admin@123"}'
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

## Step 4: Start Frontend (1 minute)

Open a new terminal and run:

```bash
cd frontend
npm run dev
```

Then open your browser: **http://localhost:5173**

Login with:
- **Email**: `admin@tensorschool.com`
- **Password**: `Admin@123`

---

## ✅ Success Checklist

After completing the steps above, you should have:

- [x] Backend running on http://localhost:5000
- [x] Database with 15 tables
- [x] Admin user created
- [x] 13 classes and 52 sections
- [x] Login API working
- [ ] Frontend running on http://localhost:5173
- [ ] Can login to dashboard

---

## 🎯 What's Next?

Once you can login to the frontend:

1. **Explore the Dashboard** - See KPI cards
2. **Create Students** - Add a few test students
3. **Mark Attendance** - Try marking attendance
4. **Create Fee Structures** - Set up fees for classes
5. **Create Exams** - Add exams and enter marks
6. **View Reports** - Check pending fees, results, etc.

---

## 🆘 Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run `complete-setup.sql` again in Supabase

### Issue: Login returns "Invalid credentials"
**Solution**: 
1. Check if user exists: `SELECT * FROM users;`
2. Password is case-sensitive: `Admin@123` (capital A)

### Issue: Backend not running
**Solution**: 
```bash
cd backend
npm run dev
```

---

## 📞 Default Credentials

**Admin User**:
- Email: `admin@tensorschool.com`
- Password: `Admin@123`
- Role: `admin`

**⚠️ Important**: Change this password in production!

---

**Ready? Start with Step 1!** 🚀
