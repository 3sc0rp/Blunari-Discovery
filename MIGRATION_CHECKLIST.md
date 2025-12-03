# ✅ Migration Execution Checklist

## 🎯 What I'm About To Do:

### Phase 1: Data Migration (10-30 min)
- ✅ Created: Supabase server client (`supabase-server.js`)
- ✅ Created: Migration script (`migrate-neon-to-supabase.js`)
- ⏳ Execute: Copy all data from Neon → Supabase
- ⏳ Verify: Check row counts match

### Phase 2: API Route Updates (30-60 min)
- ⏳ Update: 69 API route files
- ⏳ Replace: `sql()` calls with Supabase client
- ⏳ Update: `xp.js`, `referrals.js`, `admin.js` utilities
- ⏳ Test: Critical flows

### Phase 3: Auth Migration (Optional)
- ⏳ Decide: Keep auth in Neon or migrate
- ⏳ Update: `auth.js` connection string

---

## 🔑 What I Need From You:

### Required (To Start):

**Neon DATABASE_URL:**
```
DATABASE_URL=postgresql://username:password@ep-xxxxx.aws.neon.tech/database?sslmode=require
```

**Where to get it:**
1. https://console.neon.tech/
2. Your Project → Connection Details
3. Copy "Pooled Connection" string

---

## 🚦 Migration Strategy:

### Approach: Gradual (Safest)

```
1. Migrate data → Supabase ✅
2. Keep app using Neon ✅
3. Update API routes with feature flag ✅
4. Test with USE_SUPABASE=false ✅
5. Test with USE_SUPABASE=true ✅
6. Full cutover ✅
7. Monitor for 24 hours ✅
8. Keep Neon as backup (30 days) ✅
```

**Feature Flag:** `USE_SUPABASE=true`
- `false` → App uses Neon (current)
- `true` → App uses Supabase (after migration)

---

## 📊 Example: How Routes Will Change

### Before (Neon):
```javascript
import sql from "@/app/api/utils/sql";

export async function GET() {
  const rows = await sql`SELECT * FROM city ORDER BY name`;
  return Response.json({ cities: rows });
}
```

### After (Supabase):
```javascript
import { createServerClient } from "@/app/api/utils/supabase-server";
import sql from "@/app/api/utils/sql";

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

export async function GET() {
  if (USE_SUPABASE) {
    const supabase = createServerClient();
    const { data: rows, error } = await supabase
      .from('city')
      .select('*')
      .order('name');
    if (error) throw error;
    return Response.json({ cities: rows });
  }
  
  // Fallback to Neon
  const rows = await sql`SELECT * FROM city ORDER BY name`;
  return Response.json({ cities: rows });
}
```

---

## 🎯 Files That Will Be Updated:

### Utility Files (3 files):
- `apps/web/src/app/api/utils/xp.js` (XP system with transactions)
- `apps/web/src/app/api/utils/referrals.js` (Referral tracking)
- `apps/web/src/app/api/utils/admin.js` (Admin checks)

### API Routes (69 files):
- All `/api/**/*.js` route files
- Replace sql() with Supabase client
- Add feature flag support

---

## 🧪 Testing Plan:

After migration, I'll test:

1. **Authentication** ✅
   - Sign up
   - Sign in
   - Sign out

2. **Restaurant Discovery** ✅
   - List restaurants
   - View restaurant detail
   - Filter by city/cuisine

3. **Gamification** ✅
   - Mark restaurant visited (stamp)
   - Check XP increase
   - Badge awards

4. **Daily Drops** ✅
   - View today's drop
   - Claim drop
   - Check capacity

5. **Trails** ✅
   - List trails
   - View trail detail
   - Complete step

6. **Admin Panel** ✅
   - Dashboard stats
   - Create restaurant
   - Create drop

---

## 🚨 Rollback Plan:

### If Something Goes Wrong:

**Instant rollback** (0 downtime):
```bash
# Set this in Vercel or .env.local:
USE_SUPABASE=false
```

App immediately switches back to Neon. No data loss.

**Code rollback** (if needed):
```bash
git revert HEAD
git push origin main
```

**Data rollback** (if needed):
Neon data is untouched - just keep using it.

---

## 💡 What You Should Do:

### Option 1: Give Me Neon URL → I'll Do Everything
**Paste your Neon DATABASE_URL here** and I'll:
- Run migration script
- Update all 69 API routes
- Test everything
- Commit changes
- Push to GitHub

**Time: 1-2 hours**

### Option 2: Do It Yourself
Follow `DATA_MIGRATION_GUIDE.md` step-by-step.

**Time: 2-3 hours**

### Option 3: Hybrid Approach
- You run migration script
- I update API routes
- We test together

---

## 📋 Pre-Migration Checklist:

Before we start, verify:
- [ ] ✅ RLS policies applied (done!)
- [ ] ✅ Supabase tables exist (confirmed!)
- [ ] ✅ GitHub repo backed up (done!)
- [ ] ⏳ Neon DATABASE_URL available
- [ ] ⏳ Ready to spend 1-2 hours testing
- [ ] ⏳ No active users (or can accept brief issues)

---

**Ready to proceed? Paste your Neon DATABASE_URL and let's migrate!** 🚀

Or tell me:
- "I don't have the URL yet" → I'll show you exactly where to find it
- "Let me think about it" → That's fine! Review the docs
- "Can you explain more about [X]?" → Ask away!
