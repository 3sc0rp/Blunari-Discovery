# 📦 Data Migration Guide: Neon → Supabase

Complete guide to migrate all data from Neon to Supabase safely.

---

## ⚠️ IMPORTANT: Read Before Running

### What This Does:
- ✅ Copies ALL data from Neon → Supabase
- ✅ Preserves all existing data (uses upsert)
- ✅ Safe to run multiple times
- ✅ Handles conflicts gracefully
- ⚠️  Does NOT delete data from Neon (backup preserved)

### What You Need:
1. **Neon connection string** (DATABASE_URL)
2. **Supabase credentials** (URL + Service Role Key)
3. **10-30 minutes** depending on data size
4. **Backup** of Neon database (recommended)

---

## 🚀 Step-by-Step Migration

### Step 1: Set Up Environment (5 min)

Create `apps/web/.env.local`:

```bash
# Neon Database (Source)
DATABASE_URL=postgresql://your-neon-connection-string

# Supabase (Target)
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to get Neon connection string:**
1. Go to Neon Dashboard
2. Your Project → Connection Details
3. Copy "Pooled Connection" string

---

### Step 2: Install Dependencies (if needed)

```bash
cd apps/web
npm install dotenv @neondatabase/serverless @supabase/supabase-js
```

---

### Step 3: Run Migration Script

```bash
cd apps/web
node scripts/migrate-neon-to-supabase.js
```

**What happens:**
1. Script connects to both Neon and Supabase
2. Migrates tables in correct order (respecting foreign keys)
3. Shows progress for each table
4. Verifies row counts
5. Prints summary

**Expected output:**
```
🚀 Starting Data Migration: Neon → Supabase
======================================================================

📦 Migrating table: city
────────────────────────────────────────────────────────────
  📊 Found 3 rows in Neon
  ⏳ Migrating batch 1 (3 rows)...
  ✅ Batch migrated (3/3)
  
  📊 Summary:
     Neon rows: 3
     Supabase rows: 3
     Migrated: 3
     Errors: 0

... (repeats for each table)

======================================================================
📊 MIGRATION SUMMARY
======================================================================

✅ Successful: 26
⚠️  Partial: 0
❌ Errors: 0
⏭️  Skipped: 0

📊 Total rows migrated: 1,234
⏱️  Duration: 45.23s

✅ Migration complete!
🎉 All tables migrated successfully!
```

---

### Step 4: Verify Migration

Run verification in Supabase SQL Editor:

```sql
-- Check row counts match
SELECT 
  'city' as table_name,
  COUNT(*) as row_count
FROM city
UNION ALL
SELECT 'restaurant', COUNT(*) FROM restaurant
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_profile', COUNT(*) FROM user_profile
UNION ALL
SELECT 'restaurant_stamps', COUNT(*) FROM restaurant_stamps
ORDER BY table_name;
```

Compare these counts with your Neon database.

---

### Step 5: Update API Routes (Next section)

Once data is migrated, update API routes to use Supabase client instead of Neon sql().

---

## 🔧 Migration Table Order

**Order matters** to respect foreign key relationships:

1. **Static tables** (no dependencies)
   - `city`, `badge`

2. **Content tables** (depend on static)
   - `restaurant` (→ city)
   - `restaurant_images` (→ restaurant)
   - `curated_lists`, `curated_list_entries`
   - `videos` (→ restaurant)
   - `quest`, `trails`, `trail_steps`
   - `daily_drops` (→ restaurant)

3. **User tables** (depend on content)
   - `users` (base user data)
   - `user_profile` (→ users)
   - `favorite`, `restaurant_stamps`, `checkin`
   - `xp_event`, `user_badge`, `user_quest`
   - `daily_drop_claims`, `trail_step_completions`
   - `video_likes`, `video_events`
   - `referral_code`, `referral_claim`, `referral_events`
   - `app_events`

---

## ⚠️ Known Issues & Solutions

### Issue 1: "auth_users" table

**Problem**: auth.js uses special tables (`auth_users`, `auth_accounts`, `auth_sessions`)

**Solution**: These are managed by the auth system. Options:
1. **Keep in Neon** - Auth tables stay in Neon (hybrid approach)
2. **Migrate auth.js** - Update connection string to Supabase
3. **Use Supabase Auth** - Switch to native Supabase auth (major change)

**Recommendation**: Keep auth in Neon for now, migrate later.

### Issue 2: Table doesn't exist

**Problem**: Script tries to migrate a table that doesn't exist in Neon

**Solution**: Script automatically skips - no action needed

### Issue 3: Foreign key violations

**Problem**: Trying to insert a row that references a non-existent parent

**Solution**: Migration order handles this automatically

### Issue 4: Unique constraint violations

**Problem**: Duplicate data on re-run

**Solution**: Script uses `upsert` with conflict handling - safe to re-run

---

## 🔄 Re-running Migration

**Safe to re-run** if:
- Migration partially failed
- New data added to Neon
- Want to sync changes

The script will:
- ✅ Skip unchanged rows
- ✅ Update modified rows
- ✅ Add new rows
- ✅ Not delete anything

---

## 📊 Monitoring Migration

### During Migration:
Watch for:
- ✅ Progress bars per table
- ⚠️  Warning messages (partial migrations)
- ❌ Error messages (failed tables)

### After Migration:
Check Supabase Dashboard:
1. **Table Editor** - Browse data visually
2. **Database** - See row counts
3. **Logs** - Check for errors

---

## 🚨 Rollback Plan

If something goes wrong:

### Option 1: Re-run Migration
```bash
node scripts/migrate-neon-to-supabase.js
```
Safe to run multiple times.

### Option 2: Clear Supabase and Start Over
```sql
-- In Supabase SQL Editor
TRUNCATE TABLE app_events, referral_events, referral_claim, referral_code,
  video_events, video_likes, trail_step_completions, daily_drop_claims,
  user_quest, user_badge, xp_event, checkin, restaurant_stamps, favorite,
  user_profile, users, daily_drops, trail_steps, trails, quest,
  videos, curated_list_entries, curated_lists, restaurant_images, restaurant,
  badge, city
CASCADE;
```

Then re-run migration.

### Option 3: Keep Using Neon
Don't set `USE_SUPABASE=true` - app continues using Neon.

---

## 🎯 Post-Migration Checklist

After successful migration:

- [ ] Verify row counts match between Neon and Supabase
- [ ] Test a few key queries in Supabase SQL Editor
- [ ] Check that RLS policies work correctly
- [ ] Update API routes (see next section)
- [ ] Set `USE_SUPABASE=true` in environment
- [ ] Test the app thoroughly
- [ ] Monitor for errors for 24 hours
- [ ] Keep Neon as backup for 30 days
- [ ] Cancel Neon subscription after validation period

---

## 📝 Migration Log Template

Keep track of your migration:

```
Migration Date: _____________
Neon Database: _____________
Supabase Project: arlgghjxeffmeqblkucz

Tables Migrated:
[ ] city (__ rows)
[ ] badge (__ rows)
[ ] restaurant (__ rows)
[ ] restaurant_images (__ rows)
[ ] users (__ rows)
[ ] user_profile (__ rows)
... etc

Total Rows: _______
Duration: _______ seconds
Status: Success / Partial / Failed
Notes: _______________________
```

---

## 🤔 Should You Migrate Now?

### ✅ Yes, if:
- You want to use Supabase as primary database
- You're comfortable with potential downtime during testing
- You have Neon backup
- You can monitor and fix issues

### ⏸️ Wait, if:
- You're in the middle of active development
- You don't have time to test thoroughly
- You're close to a launch date
- You want to test on staging first

---

## 🆘 Need Help?

**If migration fails:**
1. Copy the full error output
2. Check which table failed
3. Verify foreign key relationships
4. Re-run the script (it's idempotent)

**Common fixes:**
- Ensure all parent tables are migrated first
- Check that Supabase tables exist
- Verify RLS policies are applied
- Check connection strings are correct

---

**Ready to migrate? Tell me:**
- **"Run the migration"** → I'll help you execute it
- **"I need Neon connection string"** → I'll show you where to get it
- **"Explain more"** → I'll clarify any step
- **"Wait, let me prepare"** → That's fine! This guide will be here.

What would you like to do? 🚀

