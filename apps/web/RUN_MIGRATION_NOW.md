# ⚡ Run Data Migration NOW

## 🎯 Situation:

You have:
- ✅ **Neon database** with all your data
- ✅ **Supabase database** with empty tables + RLS
- ⏳ Need to copy: Neon → Supabase

---

## 🚀 Quick Migration (5 Minutes)

### Option 1: One-Line Command (Windows PowerShell)

```powershell
cd apps/web

$env:NEON_DATABASE_URL="postgresql://neondb_owner:npg_lR4kmuN1TqaZ@ep-frosty-sound-ahkvzqmn.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"; $env:SUPABASE_URL="https://arlgghjxeffmeqblkucz.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybGdnaGp4ZWZmbWVxYmxrdWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3OTgyMywiZXhwIjoyMDc5MjU1ODIzfQ.S04MBBgxHMyZfx9hUdIFq_bBKdR81sgCl_fAsZrNmYI"; node scripts/migrate-neon-to-supabase.js
```

### Option 2: Create .env.local File

Create `apps/web/.env.local`:
```bash
NEON_DATABASE_URL=postgresql://neondb_owner:npg_lR4kmuN1TqaZ@ep-frosty-sound-ahkvzqmn.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybGdnaGp4ZWZmbWVxYmxrdWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY3OTgyMywiZXhwIjoyMDc5MjU1ODIzfQ.S04MBBgxHMyZfx9hUdIFq_bBKdR81sgCl_fAsZrNmYI
```

Then run:
```bash
cd apps/web
node scripts/migrate-neon-to-supabase.js
```

---

## ⏱️ What Will Happen:

```
⏳ Connecting to Neon...
⏳ Connecting to Supabase...
✅ Connected!

📦 Migrating city... (3 rows) ✅
📦 Migrating badge... (5 rows) ✅
📦 Migrating restaurant... (50 rows) ✅
📦 Migrating users... (20 rows) ✅
... (24 more tables)

✅ Migration complete! (1,234 rows in 45s)
```

---

## 🔧 After Migration:

Update your `DATABASE_URL` to point to Supabase:

**In Vercel Environment Variables:**
```bash
# OLD (Neon)
DATABASE_URL=postgresql://neondb_owner:...@ep-frosty-sound...neon.tech/neondb

# NEW (Supabase)
DATABASE_URL=postgresql://postgres:drood17D$@db.arlgghjxeffmeqblkucz.supabase.co:5432/postgres
```

**In your local .env.local:**
Same change!

---

## ✅ Then You're Done!

Your app will:
- ✅ Connect to Supabase
- ✅ Use RLS-protected data
- ✅ Work exactly the same
- ✅ Be ready for production

---

**Want me to run the migration for you?** Just say "yes" and I'll execute it!

