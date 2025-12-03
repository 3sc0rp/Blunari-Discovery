/**
 * Data Migration: Neon → Supabase
 * 
 * This script migrates all data from Neon to Supabase Postgres.
 * Safe to run multiple times (uses upsert/conflict handling).
 * 
 * Usage:
 *   node scripts/migrate-neon-to-supabase.js
 * 
 * Requirements:
 *   - DATABASE_URL (Neon connection string)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const NEON_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!NEON_URL) {
  console.error('❌ Missing DATABASE_URL for Neon');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const neonSql = neon(NEON_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Migration order: static → content → user data
const MIGRATION_ORDER = [
  // Static tables (no dependencies)
  { table: 'city', pkColumn: 'id' },
  { table: 'badge', pkColumn: 'id' },
  
  // Content tables
  { table: 'restaurant', pkColumn: 'id', fkCheck: 'city_id' },
  { table: 'restaurant_images', pkColumn: 'id', fkCheck: 'restaurant_id' },
  { table: 'curated_lists', pkColumn: 'id' },
  { table: 'curated_list_entries', pkColumn: 'id', fkCheck: 'list_id' },
  { table: 'videos', pkColumn: 'id', fkCheck: 'restaurant_id' },
  { table: 'quest', pkColumn: 'id' },
  { table: 'trails', pkColumn: 'id' },
  { table: 'trail_steps', pkColumn: 'id', fkCheck: 'trail_id' },
  { table: 'daily_drops', pkColumn: 'id', fkCheck: 'restaurant_id' },
  
  // User tables (ensure users exist first)
  { table: 'users', pkColumn: 'id' },
  { table: 'user_profile', pkColumn: 'user_id', fkCheck: 'user_id' },
  { table: 'favorite', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'restaurant_stamps', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'checkin', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'xp_event', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'user_badge', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'user_quest', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'daily_drop_claims', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'trail_step_completions', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'video_likes', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'video_events', pkColumn: 'id', fkCheck: 'user_id' },
  { table: 'referral_code', pkColumn: 'id', fkCheck: 'referrer_user_id' },
  { table: 'referral_claim', pkColumn: 'id', fkCheck: 'referee_user_id' },
  { table: 'referral_events', pkColumn: 'id', fkCheck: 'inviter_user_id' },
  { table: 'app_events', pkColumn: 'id', fkCheck: 'user_id' },
];

async function migrateTable(tableName, pkColumn) {
  console.log(`\n📦 Migrating table: ${tableName}`);
  console.log('─'.repeat(60));

  try {
    // 1. Check if table exists in Neon
    let neonRows;
    try {
      neonRows = await neonSql(`SELECT * FROM ${tableName}`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log(`  ⏭️  Table doesn't exist in Neon - skipping`);
        return { table: tableName, status: 'skipped', reason: 'not_in_neon' };
      }
      throw err;
    }

    if (!neonRows || neonRows.length === 0) {
      console.log(`  ✅ Empty table in Neon (0 rows)`);
      return { table: tableName, status: 'success', rowCount: 0 };
    }

    console.log(`  📊 Found ${neonRows.length} rows in Neon`);

    // 2. Check if table exists in Supabase
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (tableCheckError) {
      console.log(`  ❌ Table doesn't exist in Supabase: ${tableCheckError.message}`);
      return { table: tableName, status: 'error', error: tableCheckError.message };
    }

    // 3. Migrate data in batches (500 rows at a time)
    const BATCH_SIZE = 500;
    let migratedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < neonRows.length; i += BATCH_SIZE) {
      const batch = neonRows.slice(i, i + BATCH_SIZE);
      
      console.log(`  ⏳ Migrating batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)...`);

      // Upsert to Supabase (handles conflicts gracefully)
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { 
          onConflict: pkColumn,
          ignoreDuplicates: false // Update if exists
        });

      if (error) {
        console.log(`  ⚠️  Batch error: ${error.message}`);
        errorCount += batch.length;
      } else {
        migratedCount += batch.length;
        console.log(`  ✅ Batch migrated (${migratedCount}/${neonRows.length})`);
      }
    }

    // 4. Verify migration
    const { count: supabaseCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`\n  📊 Summary:`);
    console.log(`     Neon rows: ${neonRows.length}`);
    console.log(`     Supabase rows: ${supabaseCount || 0}`);
    console.log(`     Migrated: ${migratedCount}`);
    console.log(`     Errors: ${errorCount}`);

    if (errorCount > 0) {
      return { 
        table: tableName, 
        status: 'partial', 
        rowCount: migratedCount,
        errors: errorCount 
      };
    }

    return { table: tableName, status: 'success', rowCount: migratedCount };

  } catch (error) {
    console.log(`  ❌ Fatal error: ${error.message}`);
    return { table: tableName, status: 'error', error: error.message };
  }
}

async function runMigration() {
  console.log('🚀 Starting Data Migration: Neon → Supabase\n');
  console.log('='.repeat(70));
  console.log(`Source: Neon (${NEON_URL?.substring(0, 50)}...)`);
  console.log(`Target: Supabase (${SUPABASE_URL})`);
  console.log('='.repeat(70));

  const results = [];
  const startTime = Date.now();

  // Migrate in order
  for (const config of MIGRATION_ORDER) {
    const result = await migrateTable(config.table, config.pkColumn);
    results.push(result);
    
    // Small delay between tables to avoid overwhelming the DB
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.status === 'success');
  const partial = results.filter(r => r.status === 'partial');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`\n✅ Successful: ${successful.length}`);
  console.log(`⚠️  Partial: ${partial.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);

  const totalRows = results.reduce((sum, r) => sum + (r.rowCount || 0), 0);
  console.log(`\n📊 Total rows migrated: ${totalRows}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (errors.length > 0) {
    console.log(`\n❌ Tables with errors:`);
    errors.forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }

  if (partial.length > 0) {
    console.log(`\n⚠️  Tables with partial migration:`);
    partial.forEach(r => {
      console.log(`   - ${r.table}: ${r.rowCount} migrated, ${r.errors} errors`);
    });
  }

  console.log('\n✅ Migration complete!');
  
  if (errors.length === 0 && partial.length === 0) {
    console.log('\n🎉 All tables migrated successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Update API routes to use Supabase client');
    console.log('   3. Set USE_SUPABASE=true in environment');
    console.log('   4. Test thoroughly');
    console.log('   5. Keep Neon as backup for 30 days');
  } else {
    console.log('\n⚠️  Some tables had issues. Review errors above.');
    console.log('   You can re-run this script - it will only update changed rows.');
  }
}

// Run migration
runMigration().catch(error => {
  console.error('\n💥 Migration failed:', error.message);
  console.error(error);
  process.exit(1);
});

