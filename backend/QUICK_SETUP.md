# 🚀 Quick Backend Setup Guide

## Step 1: Get Supabase Service Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rirclhnsmxwfbvzftqjj`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
   - ⚠️ This key bypasses Row Level Security - keep it secret!

## Step 2: Update .env File

Replace the `SUPABASE_SERVICE_KEY` in `Tensor/backend/.env`:

```env
SUPABASE_SERVICE_KEY=your-actual-service-role-key-here
```

## Step 3: Initialize Database Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `src/database/schema.sql`
4. Click **Run** to create all tables
5. Copy and paste the contents of `src/database/seed.sql`
6. Click **Run** to insert seed data

## Step 4: Start Backend Server

```bash
cd Tensor/backend
npm run dev
```

## Step 5: Verify Backend is Running

Open in browser or use curl:

```bash
# Health check
curl http://localhost:5000/health

# API documentation
open http://localhost:5000/api-docs
```

## Default Test Credentials

After running seed.sql, you can login with:

- **Admin**: `admin@tensorschool.com` / `password`
- **Teacher**: `teacher@tensorschool.com` / `password`

## Troubleshooting

### Database Connection Failed
- ✅ Check SUPABASE_URL is correct
- ✅ Check SUPABASE_SERVICE_KEY is the service_role key (not anon key)
- ✅ Check your Supabase project is active

### Port Already in Use
```bash
# Change PORT in .env to a different port (e.g., 5001)
PORT=5001
```

### Schema Already Exists
- If tables already exist, you can skip schema.sql
- Just run seed.sql for test data

---

**Ready to proceed once you have the service key!** 🎯
