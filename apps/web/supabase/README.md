# Supabase Migration Guide

This directory contains everything needed to migrate from Neon → Supabase safely.

## 📁 Structure

```
supabase/
├── config.toml                          # Supabase CLI config (auto-generated)
├── migrations/
│   ├── 00001_enable_rls_policies.sql    # RLS policies for all tables
│   └── 00001_rollback_rls.sql           # Emergency rollback
├── schema-inspector.js                   # Inspect current schema
└── README.md                             # This file
```

---

## 🔐 Setup

### 1. Create `.env.local` in `apps/web/`

```bash
# Supabase Configuration
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

**IMPORTANT**: `.env.local` is gitignored - never commit credentials!

### 2. Install dependencies (if needed)

```bash
cd apps/web
npm install @supabase/supabase-js dotenv
```

---

## 🔍 Step 1: Inspect Current Schema

```bash
node supabase/schema-inspector.js
```

This will show:
- Which tables exist
- Row counts
- Any errors

---

## 🛡️ Step 2: Apply RLS Policies

### Review the migration first:
```bash
cat supabase/migrations/00001_enable_rls_policies.sql
```

### Apply via Supabase Dashboard SQL Editor:
1. Go to: https://supabase.com/dashboard/project/arlgghjxeffmeqblkucz/sql
2. Copy contents of `00001_enable_rls_policies.sql`
3. Paste and run

### OR via CLI (requires Docker):
```bash
supabase db push
```

### Verify RLS is enabled:
Run in SQL Editor:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

---

## ⚠️ Rollback (If Needed)

If something goes wrong, run:

```sql
-- In Supabase SQL Editor
\i supabase/migrations/00001_rollback_rls.sql
```

Or manually:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

---

## 🚀 Step 3: Data Migration (TODO)

Coming next:
1. Export from Neon
2. Transform data if needed
3. Import to Supabase
4. Verify integrity

---

## 📋 RLS Policy Summary

### User-Owned Tables
Users can:
- **SELECT** their own data
- **INSERT** their own data (where applicable)
- **UPDATE** their own data (where applicable)
- **DELETE** their own data (favorites, likes only)

Service role can do everything.

**Tables**:
- `users`, `user_profile`, `user_badge`
- `restaurant_stamps`, `checkin`, `favorite`
- `xp_event`, `user_quest`
- `daily_drop_claims`, `trail_step_completions`
- `video_likes`, `video_events`
- `referral_code`, `referral_claim`, `referral_events`
- `app_events`

### Public Read Tables
Anyone can:
- **SELECT** published content

Service role can:
- **ALL** operations

**Tables**:
- `city` (all)
- `restaurant` (where published=true)
- `restaurant_images` (where published=true)
- `list` (where published=true)
- `list_entry` (all)
- `badge` (where active=true)
- `quest` (where active=true)
- `trails` (where is_published=true)
- `trail_steps` (all)
- `daily_drops` (where is_published=true)
- `videos` (where is_published=true)

---

## ✅ Security Checklist

- [x] RLS enabled on all tables
- [x] Users can only access their own data
- [x] Public content is read-only for users
- [x] Service role has full access (for API routes)
- [x] Rollback plan created
- [ ] RLS policies applied to remote database
- [ ] RLS policies tested with real users
- [ ] Data migrated from Neon

---

## 🔧 Troubleshooting

### "Could not find the function exec_sql"
This is normal - Supabase doesn't expose this by default. Use the schema-inspector.js script instead.

### "Docker Desktop is required"
You can apply migrations via SQL Editor instead of CLI.

### "Permission denied"
Make sure you're using the SERVICE_ROLE_KEY, not the ANON_KEY.

---

## 📚 Next Steps

1. ✅ Initialize Supabase CLI
2. ✅ Generate RLS policies
3. ⏳ Apply RLS policies
4. ⏳ Test with single table
5. ⏳ Migrate data
6. ⏳ Update app code

See `SUPABASE_MIGRATION_REPORT.md` in project root for full plan.

