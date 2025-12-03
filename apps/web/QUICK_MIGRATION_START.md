# ⚡ Quick Migration Start

## 🔑 I Need Your Neon Connection String

To migrate your data, I need your Neon DATABASE_URL.

### Where to Get It:

1. Go to: **https://console.neon.tech/**
2. Select your project
3. Go to **Dashboard**
4. Look for **Connection Details** section
5. Copy the **Pooled Connection** string

**It looks like this:**
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/database?sslmode=require
```

### What to Do:

**Option 1: Paste it here** (I'll run migration immediately)
```
DATABASE_URL=postgresql://...your-connection-string
```

**Option 2: Create .env.local manually**
```bash
# Create apps/web/.env.local with:
DATABASE_URL=postgresql://...your-connection-string
SUPABASE_URL=https://arlgghjxeffmeqblkucz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-key

# Then run:
cd apps/web
node scripts/migrate-neon-to-supabase.js
```

---

## 📊 What Will Happen:

### Migration Process (10-30 min):
```
1. Connect to Neon ✅
2. Connect to Supabase ✅
3. Migrate city → 3 rows ✅
4. Migrate badge → 5 rows ✅
5. Migrate restaurant → 50 rows ✅
... (for each table)
26. Print summary ✅
```

### Then API Route Updates (30-60 min):
```
1. Update xp.js ✅
2. Update referrals.js ✅
3. Update admin.js ✅
4. Update 69 API routes ✅
5. Test everything ✅
```

---

## 🛡️ Safety Guarantees:

- ✅ **No data deletion** - Neon stays untouched
- ✅ **Idempotent** - Can run multiple times safely
- ✅ **Atomic operations** - Each table migrated completely or not at all
- ✅ **Rollback ready** - Can switch back to Neon instantly
- ✅ **RLS protected** - Supabase secured with policies

---

## ⏱️ Timeline:

| Task | Duration | Status |
|------|----------|--------|
| Data migration | 10-30 min | ⏳ Waiting for DATABASE_URL |
| API route updates | 30-60 min | ⏳ After migration |
| Testing | 15-30 min | ⏳ After updates |
| **Total** | **1-2 hours** | |

---

## 💬 Ready?

**Paste your Neon DATABASE_URL here and I'll:**
1. Run the migration automatically
2. Update all 69 API routes
3. Test critical flows
4. Commit and push changes

**Or tell me:**
- "I need help getting the connection string"
- "Let me do it manually" (I'll guide you)
- "Wait, I want to review first"

**I'm ready to execute when you are!** 🚀

