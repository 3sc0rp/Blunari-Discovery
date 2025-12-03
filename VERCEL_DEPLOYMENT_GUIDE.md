# 🚀 Vercel Deployment Guide - Blunari Discovery

Complete guide to deploy your React Router v7 app to Vercel.

---

## 📋 Prerequisites

1. ✅ Vercel account (https://vercel.com/signup)
2. ✅ GitHub repo (already done: https://github.com/3sc0rp/Blunari-Discovery.git)
3. ✅ Supabase project (already setup)
4. ⏳ Neon database (or migrate to Supabase first)

---

## 🔑 Environment Variables You Need

### Required Variables (Set in Vercel Dashboard):

```bash
# Database (Neon - current setup)
DATABASE_URL=postgresql://...your-neon-connection-string

# Supabase (Storage + Database)
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# OAuth (Google Sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Auth.js Secret (Generate a random string)
AUTH_SECRET=your-random-secret-string

# App URL (Set to your Vercel domain)
APP_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

### How to Generate AUTH_SECRET:
```bash
# Run this in your terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🛠️ Step-by-Step Deployment

### Step 1: Import Project to Vercel

1. Go to: https://vercel.com/new
2. Select "Import Git Repository"
3. Connect your GitHub account
4. Select: `3sc0rp/Blunari-Discovery`
5. **IMPORTANT**: Set "Root Directory" to `apps/web`
6. Framework will auto-detect as "React Router"

### Step 2: Configure Build Settings

In Vercel dashboard:
```
Framework Preset: Other
Root Directory: apps/web
Build Command: npm run build
Output Directory: build/client
Install Command: npm install
```

### Step 3: Add Environment Variables

In Vercel Project Settings → Environment Variables:

1. Click "Add New"
2. Paste each variable name and value
3. Select: **Production, Preview, Development** (all three)
4. Click "Save"

**Variables to add** (8 required):
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `APP_URL`

### Step 4: Deploy!

Click "Deploy" button. Vercel will:
1. Clone your repo
2. Install dependencies
3. Build the app
4. Deploy to CDN

**Build time**: ~3-5 minutes

---

## ⚠️ Known Issues & Fixes

### Issue 1: "Top-level await" Build Error

**Symptom**:
```
Top-level await is not available in the configured target environment
```

**Status**: ✅ FIXED (vite.config.ts updated with `build.target: 'es2022'`)

### Issue 2: OAuth Redirect URI

**After first deploy**, you need to:
1. Get your Vercel URL (e.g., `https://blunari-discovery.vercel.app`)
2. Add to Google OAuth Console:
   - Authorized JavaScript origins: `https://blunari-discovery.vercel.app`
   - Authorized redirect URIs: `https://blunari-discovery.vercel.app/api/auth/callback/google`

### Issue 3: Supabase Auth Configuration

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://blunari-discovery.vercel.app`
- Redirect URLs: Add `https://blunari-discovery.vercel.app/**`

### Issue 4: Database Connection Limits

**Neon free tier**: 100 concurrent connections
**Recommendation**: Use connection pooling

In your Neon dashboard:
1. Enable "Connection Pooling"
2. Use the pooled connection string for `DATABASE_URL`

---

## 🏗️ Build Configuration

The build is already configured in `vite.config.ts`. If you need to customize:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2022', // Supports top-level await
    rollupOptions: {
      output: {
        manualChunks: undefined, // Or customize chunking strategy
      },
    },
  },
  // ... rest of config
});
```

---

## 📊 Vercel Project Settings

### Recommended Settings:

**General**:
- Node.js Version: 20.x (latest LTS)
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `build/client`
- Root Directory: `apps/web`

**Environment Variables**:
- All 8 variables listed above
- ✅ Set for Production
- ✅ Set for Preview (optional)
- ⚠️ Never commit to GitHub!

**Functions**:
- Region: Choose closest to your Supabase (US East recommended)
- Memory: 1024 MB (default)
- Max Duration: 10s (free tier)

**Domains**:
- Add custom domain after initial deploy
- Update `APP_URL` env var after adding domain

---

## 🚀 Deployment Commands

### Deploy from CLI (Optional):

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deploy from Git (Recommended):

1. Push to `main` branch
2. Vercel auto-deploys
3. Check deployment status in dashboard

---

## 🧪 Post-Deployment Testing

After deployment, test these endpoints:

### 1. Health Check:
```
https://your-app.vercel.app/api/health
```
Should return: `{ "status": "ok" }`

### 2. Cities API:
```
https://your-app.vercel.app/api/cities
```
Should return: `{ "cities": [...] }`

### 3. Home Page:
```
https://your-app.vercel.app/
```
Should load without errors

### 4. Sign In:
```
https://your-app.vercel.app/account/signin
```
Test email/password login

### 5. Admin Panel:
```
https://your-app.vercel.app/admin
```
Should redirect to signin if not authenticated

---

## 🔧 Troubleshooting

### Build Fails

**Check logs** in Vercel dashboard:
1. Go to Deployments
2. Click latest deployment
3. View build logs
4. Look for errors in red

**Common fixes**:
```bash
# Clear build cache
vercel --force

# Check environment variables
vercel env ls

# Test build locally
npm run build
```

### Runtime Errors

**Check function logs**:
1. Vercel Dashboard → Deployments → Click deployment
2. Go to "Functions" tab
3. See real-time logs

**Common issues**:
- Missing environment variables
- Database connection timeout
- CORS errors

### Database Connection Issues

**If using Neon**:
- Enable connection pooling
- Use pooled connection string
- Check connection limits (100 max on free tier)

**If using Supabase**:
- Use direct connection (Supabase has built-in pooling)
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## 🎯 Recommended Deployment Strategy

### Phase 1: Initial Deploy (Using Neon)
1. Deploy with current setup (Neon + Supabase Storage)
2. Test everything works
3. Monitor for errors

### Phase 2: Migrate to Supabase (After testing)
1. Migrate data from Neon → Supabase
2. Update `DATABASE_URL` to Supabase
3. Update API routes to use Supabase client
4. Redeploy
5. Test again

### Phase 3: Optimize
1. Enable Vercel Analytics
2. Set up custom domain
3. Configure caching headers
4. Enable preview deployments for PRs

---

## 📊 Expected Performance

**Cold Start**: 200-500ms (first request)
**Warm Response**: 50-150ms (subsequent requests)
**Build Time**: 3-5 minutes
**Deploy Time**: 30-60 seconds after build

---

## 💰 Vercel Pricing

**Free Tier** (Hobby):
- ✅ Enough for testing/MVP
- 100 GB bandwidth/month
- Serverless function execution
- Automatic HTTPS
- Preview deployments

**Pro Tier** ($20/month):
- More bandwidth
- Better analytics
- Password protection
- Advanced redirects

---

## 🔐 Security Checklist

Before going to production:

- [ ] All environment variables set in Vercel (not in code)
- [ ] Google OAuth redirect URIs updated
- [ ] Supabase auth redirect URLs updated
- [ ] RLS policies applied (✅ Already done!)
- [ ] Rate limiting configured
- [ ] CORS headers set correctly
- [ ] Custom domain with HTTPS
- [ ] Database backups enabled

---

## 📱 Mobile App Considerations

Your mobile app (Expo) needs:
1. API URL updated to production Vercel URL
2. OAuth redirect configured for mobile
3. Expo updates published

In `apps/mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app.vercel.app"
    }
  }
}
```

---

## ✅ Quick Deploy Checklist

Copy this checklist for your first deploy:

```
[ ] 1. Create Vercel account
[ ] 2. Import GitHub repo (3sc0rp/Blunari-Discovery)
[ ] 3. Set root directory to "apps/web"
[ ] 4. Add 8 environment variables
[ ] 5. Generate AUTH_SECRET
[ ] 6. Update APP_URL to Vercel domain
[ ] 7. Click Deploy
[ ] 8. Wait 3-5 minutes
[ ] 9. Test /api/health endpoint
[ ] 10. Test signin flow
[ ] 11. Update Google OAuth redirect URIs
[ ] 12. Update Supabase auth URLs
[ ] 13. Test again
[ ] 14. Celebrate! 🎉
```

---

## 🆘 Need Help?

**If deployment fails:**
1. Screenshot the error
2. Check Vercel function logs
3. Verify all 8 env vars are set
4. Make sure root directory is `apps/web`

**I can help with:**
- Debugging build errors
- Configuring environment variables
- Setting up custom domains
- Optimizing performance

---

**Ready to deploy? Let me know if you want to:**
1. **"Fix the build first"** → I'll resolve the top-level await issue
2. **"Deploy as-is"** → Push the vite.config fix and deploy
3. **"Questions about Vercel"** → Ask me anything
4. **"Deploy later"** → That's fine! This guide will be here when you need it.

What would you like to do? 🚀
