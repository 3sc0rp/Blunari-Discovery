# Environment Variables Reference

## 🔑 Required Variables for Vercel Deployment

Copy these to Vercel Dashboard → Your Project → Settings → Environment Variables

---

### 1. Database (Neon - Current Setup)

```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
```

**Where to get it:**
- Neon Dashboard → Your Project → Connection String
- **Use the "Pooled Connection" string** (not direct)

**Important:**
- ✅ Must include `?sslmode=require`
- ✅ Use pooled connection for Vercel
- ❌ Never commit this to GitHub

---

### 2. Supabase URL

```bash
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
```

**Where to get it:**
- Supabase Dashboard → Project Settings → API → Project URL
- Format: `https://[project-ref].supabase.co`

---

### 3. Supabase Service Role Key

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get it:**
- Supabase Dashboard → Project Settings → API → Service Role Key
- **⚠️ NEVER expose this to client-side code**
- **⚠️ This bypasses RLS - only use in API routes**

---

### 4. Supabase Anon Key

```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get it:**
- Supabase Dashboard → Project Settings → API → Anon Key
- ✅ Safe to expose in client-side code
- ✅ Respects RLS policies

---

### 5. Auth Secret

```bash
AUTH_SECRET=your-random-32-byte-hex-string
```

**How to generate:**
```bash
# Run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Purpose:** Signs JWT tokens for Auth.js

---

### 6. Google OAuth Client ID

```bash
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
```

**Where to get it:**
- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID if you don't have one

**Setup OAuth Client:**
1. Application type: Web application
2. Authorized JavaScript origins:
   - `http://localhost:4000` (dev)
   - `https://your-app.vercel.app` (production)
3. Authorized redirect URIs:
   - `http://localhost:4000/api/auth/callback/google` (dev)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)

---

### 7. Google OAuth Client Secret

```bash
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

**Where to get it:**
- Same place as Client ID (Google Cloud Console)
- **⚠️ Keep this secret!**

---

### 8. App URL

```bash
APP_URL=https://your-app.vercel.app
```

**What to use:**
- Development: `http://localhost:4000`
- Production: Your Vercel deployment URL

**Used for:**
- OAuth redirects
- Email verification links (future)
- Referral invite URLs
- Open Graph metadata

---

## 📋 Copy-Paste Checklist for Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

For each variable below, click "Add New" and:
1. Name: [variable name]
2. Value: [your actual value]
3. Environment: Select **Production** + **Preview**
4. Click "Save"

**Variables to add:**

```
✅ DATABASE_URL
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_ANON_KEY
✅ AUTH_SECRET
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET
✅ APP_URL
```

**Optional variables:**

```
⏳ OPENAI_API_KEY (for AI features)
⏳ STRIPE_SECRET_KEY (for payments)
⏳ SENTRY_DSN (for error tracking)
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Store all secrets in Vercel environment variables
- Use service role key ONLY in API routes (server-side)
- Use anon key for client-side Supabase queries
- Rotate keys periodically
- Enable RLS on all user tables (✅ Already done!)

### ❌ DON'T:
- Commit .env files to Git
- Expose service role key to frontend
- Use same secrets for dev and production
- Share credentials in chat/email/Slack

---

## 🚀 Quick Deploy Command

Once everything is configured in Vercel:

```bash
# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Start building
3. Deploy to production
4. Send you a notification

---

## 📊 After Deployment

**Test these URLs** (replace with your domain):

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Cities API
curl https://your-app.vercel.app/api/cities

# Home page
open https://your-app.vercel.app
```

**Update these services:**
1. **Google OAuth**: Add production redirect URIs
2. **Supabase Auth**: Add production URL to allowed list
3. **Mobile App**: Update API URL in app.json

---

**Ready to deploy? Let me know if you need help with any step!** 🚀

