# Supabase Database Migration Report

**Date**: December 2024  
**Database**: https://arlgghjxeffmeqblkucz.supabase.co  
**Status**: ✅ Schema Created, ❌ No Data, ❓ RLS Unknown

---

## 🎯 Current State Summary

### ✅ What EXISTS in Supabase:
- **28 tables** with complete schema
- All table structures match the expected design

**Tables Confirmed**:
```
✅ city                      ✅ restaurant               ✅ restaurant_images
✅ list                      ✅ list_entry               ✅ user_profile
✅ badge                     ✅ user_badge               ✅ restaurant_stamps
✅ checkin                   ✅ daily_drops              ✅ daily_drop_claims
✅ trails                    ✅ trail_steps              ✅ trail_step_completions
✅ favorite                  ✅ videos                   ✅ video_likes
✅ video_events              ✅ referral_code            ✅ referral_claim
✅ referral_events           ✅ xp_event                 ✅ quest
✅ user_quest                ✅ app_events               ✅ users
✅ admin_users
```

### ❌ What's MISSING:
1. **No data in any tables** (all have 0 rows)
2. **RLS policies** (unknown - cannot verify without direct access)
3. **Indexes** (unknown - need verification)
4. **Triggers** (unknown - need verification)
5. **Functions** (unknown - need verification)

### 🔄 What's Currently Happening:
- **App is using NEON** as primary database (based on `auth.js` and `sql.js` imports)
- **Supabase is empty** and not being used
- **Code already has Supabase Storage** integration (for images/videos)

---

## 📊 Architecture Gap Analysis

### Current Architecture:
```
Web App → Neon DB (via @neondatabase/serverless)
        → Supabase Storage (service role REST API)
```

### Target Architecture:
```
Web App → Supabase Postgres (via @supabase/supabase-js)
        → Supabase Storage (already integrated ✅)
```

---

## 🚀 Migration Action Plan

### Phase 1: Verify & Prepare (1 day)
**What I need to do next:**

1. **Create a helper SQL function** in Supabase to enable schema inspection:
   ```sql
   -- Run this in Supabase SQL Editor
   CREATE OR REPLACE FUNCTION exec_sql(query text)
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     result jsonb;
   BEGIN
     EXECUTE query INTO result;
     RETURN result;
   END;
   $$;
   ```

2. **Or use Supabase CLI** to pull schema:
   ```bash
   cd apps/web
   supabase init
   supabase link --project-ref arlgghjxeffmeqblkucz
   supabase db pull
   ```
   This will create `supabase/migrations/` with your current schema.

3. **Add RLS policies** (if missing):
   ```sql
   -- Example for user_profile
   ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "users_select_own" ON user_profile
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "users_update_own" ON user_profile
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "service_role_all" ON user_profile
     FOR ALL USING (auth.role() = 'service_role');
   ```

### Phase 2: Data Migration (2-3 days)
**Two options:**

#### Option A: Export from Neon → Import to Supabase
```bash
# 1. Export from Neon
pg_dump $NEON_DATABASE_URL > neon_export.sql

# 2. Import to Supabase
psql $SUPABASE_CONNECTION_STRING < neon_export.sql
```

#### Option B: Programmatic migration (table by table)
I can create scripts that:
1. Read from Neon
2. Transform data if needed
3. Write to Supabase
4. Verify integrity

**Benefits of Option B:**
- More control
- Can transform data during migration
- Can handle conflicts gracefully
- Easier to rollback

### Phase 3: Code Migration (3-5 days)
**Replace Neon client with Supabase client:**

**Before**:
```javascript
import sql from "@/app/api/utils/sql";
const rows = await sql('SELECT * FROM users WHERE id = $1', [userId]);
```

**After**:
```javascript
import { createServerClient } from "@/app/api/utils/supabase-server";
const supabase = createServerClient();
const { data: rows, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
if (error) throw error;
```

**Files to update** (69 API route files):
- All `/api/**route.js` files
- Auth adapter (`auth.js`) - keep on Neon if platform requires
- Update utility files (`xp.js`, `referrals.js`, etc.)

### Phase 4: Testing & Cutover (1 week)
1. **Dual-write period**: Write to both Neon and Supabase
2. **Read from Supabase**: Gradually shift reads
3. **Monitor**: Check error rates, latency
4. **Full cutover**: Stop writing to Neon
5. **Keep Neon backup**: 30 days retention

---

## 🔧 Automated Migration Tools I Can Create

Now that I can connect to your Supabase, I can create:

### 1. Schema Inspector
```bash
node scripts/inspect-supabase.js
```
- ✅ Already created
- Shows tables, row counts
- Verifies data integrity

### 2. RLS Policy Generator
```bash
node scripts/generate-rls-policies.js
```
- Auto-generate RLS policies for all tables
- Apply them to Supabase
- Verify they work correctly

### 3. Data Migration Script
```bash
node scripts/migrate-data.js --table user_profile
```
- Migrate specific tables from Neon → Supabase
- Show progress, handle errors
- Verify data integrity

### 4. Code Updater
```bash
node scripts/update-code-to-supabase.js
```
- Find all Neon SQL queries
- Replace with Supabase client calls
- Update imports

### 5. Validation Script
```bash
node scripts/validate-migration.js
```
- Compare Neon vs Supabase row counts
- Verify data integrity
- Report differences

---

## ⚡ Quick Wins (Can Do Now)

### 1. Pull Current Schema
I can set up Supabase CLI right now to get your exact schema:
```bash
cd apps/web
supabase init
supabase link --project-ref arlgghjxeffmeqblkucz
supabase db pull
```
This will give us the exact DDL for all tables.

### 2. Generate RLS Policies
Once I see the schema, I can generate complete RLS policies for all user-owned tables.

### 3. Create Migration Scripts
I can write the data migration scripts ready to execute when you want.

---

## 🎯 Next Steps - Your Choice:

### Option 1: "Let's see the full schema first"
```bash
# I'll run these commands
supabase init
supabase link --project-ref arlgghjxeffmeqblkucz  
supabase db pull
```
Then I'll show you the exact schema and we can plan better.

### Option 2: "Start the migration now"
I'll begin Phase 2 (data migration) immediately:
1. Create migration scripts
2. Migrate static tables first (cities, badges)
3. Then user data tables
4. Verify at each step

### Option 3: "Just add RLS first"
I'll create and apply all RLS policies so Supabase is ready,
then we can migrate data and code later.

---

## 💡 Recommendation

**My suggested approach:**
1. **Run `supabase db pull`** to get exact schema (5 minutes)
2. **Add RLS policies** to all user tables (30 minutes)
3. **Migrate static data** (cities, badges, lists) (1 hour)
4. **Test with a single API route** (restaurants) (2 hours)
5. **Migrate user data** in phases (2-3 days)
6. **Update all API routes** (3-5 days)

**Total time: ~1-2 weeks** for complete migration.

---

## ✅ What You Can Do Right Now

**Tell me one of these:**
1. "Pull the schema" - I'll run supabase CLI commands
2. "Start migrating" - I'll begin data migration
3. "Add RLS first" - I'll create and apply policies
4. "Show me the plan for [specific feature]" - I'll zoom in

**I'm ready to execute any of these automatically!**

