# Setup Guide - Enterprise Backend System

This guide will help you set up the enterprise backend system for the first time.

## Prerequisites Checklist

- [ ] Node.js 18.x or higher installed
- [ ] npm or yarn installed
- [ ] Supabase account created
- [ ] Supabase project created

## Step-by-Step Setup

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (under "Project API keys" - this is the secret key)

⚠️ **Important**: Use the **service role key**, not the anon key. The service role key bypasses Row Level Security and is needed for backend operations.

### 3. Generate JWT Secret

Generate a secure JWT secret (minimum 32 characters):

**Option 1 - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2 - Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Option 3 - Online Generator:**
Visit https://generate-secret.vercel.app/32

### 4. Configure Environment Variables

1. The `.env` file already exists. Open it:
```bash
# On Windows
notepad .env

# On Mac/Linux
nano .env
```

2. Update the following required values:

```env
# Replace with your actual Supabase URL
SUPABASE_URL=https://your-project-id.supabase.co

# Replace with your actual Supabase service role key
SUPABASE_SERVICE_KEY=your-actual-service-role-key-here

# Replace with your generated JWT secret (minimum 32 characters)
JWT_SECRET=your-generated-jwt-secret-here
```

3. Optionally update other settings:
   - `PORT` - Server port (default: 5000)
   - `ALLOWED_ORIGINS` - Frontend URLs for CORS
   - `LOG_LEVEL` - Logging verbosity (debug, info, warn, error)

### 5. Verify Configuration

Test that your configuration is valid:

```bash
node test-config.js
```

You should see:
```
✓ Configuration loaded successfully!
✓ All configuration values validated!
✓ Logger initialized successfully!
✓ Cache working correctly!
✓ All configuration tests passed!
```

If you see errors, check that:
- SUPABASE_URL is a valid URL (starts with https://)
- JWT_SECRET is at least 32 characters long
- All required environment variables are set

### 6. Set Up Database Schema

The backend expects certain database tables to exist. You'll need to create these in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the database schema creation scripts (these will be provided in later tasks)

### 7. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
Server started successfully
Port: 5000
Environment: development
```

### 8. Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Common Issues

### Issue: "Configuration validation failed: SUPABASE_URL must be a valid URL"

**Solution**: Make sure SUPABASE_URL in `.env` is a complete URL starting with `https://`

### Issue: "Configuration validation failed: JWT_SECRET must be at least 32 characters long"

**Solution**: Generate a new JWT secret using one of the methods in Step 3

### Issue: "Port 5000 is already in use"

**Solution**: Either:
1. Stop the process using port 5000
2. Change PORT in `.env` to a different port (e.g., 3000, 8000)

### Issue: Database connection errors

**Solution**: 
1. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
2. Check that your Supabase project is active
3. Ensure you're using the service role key, not the anon key

## Security Checklist

Before deploying to production:

- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] SUPABASE_SERVICE_KEY is kept secret and not committed to git
- [ ] `.env` file is in `.gitignore` (already configured)
- [ ] ALLOWED_ORIGINS is set to your actual frontend domain(s)
- [ ] NODE_ENV is set to 'production'
- [ ] LOG_LEVEL is set to 'info' or 'warn' (not 'debug')
- [ ] Rate limiting is configured appropriately
- [ ] HTTPS is enabled on your server

## Next Steps

After completing setup:

1. **Create database schema** - Run SQL scripts to create tables
2. **Implement middleware** - Authentication, validation, error handling
3. **Implement services** - Business logic for each feature
4. **Implement routes** - API endpoints
5. **Write tests** - Unit, integration, and property-based tests
6. **Add API documentation** - Swagger/OpenAPI specs

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Review this setup guide
3. Check the main README.md for additional information
4. Verify all environment variables are set correctly
5. Ensure dependencies are installed (`npm install`)

## Configuration Reference

See `.env.example` for a complete list of all available configuration options with descriptions.
