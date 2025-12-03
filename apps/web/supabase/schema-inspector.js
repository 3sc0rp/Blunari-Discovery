/**
 * Schema Inspector for Supabase
 * This script queries your Supabase database to get the exact schema including RLS policies
 * 
 * Usage: node supabase/schema-inspector.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://arlgghjxeffmeqblkucz.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('\n💡 Create a .env.local file with:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function inspectSchema() {
  console.log('🔍 Supabase Schema Inspector\n');
  console.log('='.repeat(70));
  
  // Get all tables
  const tables = [
    'city', 'restaurant', 'restaurant_images', 'list', 'list_entry',
    'user_profile', 'badge', 'user_badge', 'restaurant_stamps', 'checkin',
    'daily_drops', 'daily_drop_claims', 'trails', 'trail_steps', 'trail_step_completions',
    'favorite', 'videos', 'video_likes', 'video_events',
    'referral_code', 'referral_claim', 'referral_events',
    'xp_event', 'quest', 'user_quest', 'app_events',
    'users', 'admin_users'
  ];

  console.log(`\n📋 Checking ${tables.length} tables...\n`);

  const results = [];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      results.push({ table, status: '❌ ERROR', count: 0, error: error.message });
    } else {
      results.push({ table, status: '✅ EXISTS', count: count || 0 });
    }
  }

  // Print summary
  const existing = results.filter(r => r.status === '✅ EXISTS');
  const errors = results.filter(r => r.status === '❌ ERROR');

  console.log(`\n✅ Existing Tables: ${existing.length}`);
  console.log(`❌ Missing/Error: ${errors.length}\n`);

  console.log('─'.repeat(70));
  console.log(`${'Table'.padEnd(30)} ${'Status'.padEnd(15)} ${'Rows'.padEnd(10)}`);
  console.log('─'.repeat(70));

  results.forEach(r => {
    const rowCount = r.count > 0 ? `${r.count} rows` : 'empty';
    console.log(`${r.table.padEnd(30)} ${r.status.padEnd(15)} ${rowCount}`);
  });

  console.log('─'.repeat(70));

  // Summary
  const totalRows = existing.reduce((sum, r) => sum + r.count, 0);
  const tablesWithData = existing.filter(r => r.count > 0);

  console.log(`\n📊 Summary:`);
  console.log(`  Total tables: ${existing.length}`);
  console.log(`  Tables with data: ${tablesWithData.length}`);
  console.log(`  Total rows: ${totalRows}`);

  if (tablesWithData.length > 0) {
    console.log(`\n📈 Tables with data:`);
    tablesWithData.forEach(r => {
      console.log(`  - ${r.table}: ${r.count} rows`);
    });
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(r => {
      console.log(`  - ${r.table}: ${r.error}`);
    });
  }

  console.log('\n✅ Schema inspection complete!');
  console.log('\n💡 Next steps:');
  console.log('  1. Add RLS policies (run: node supabase/add-rls-policies.js)');
  console.log('  2. Migrate data from Neon (run: node supabase/migrate-data.js)');
}

inspectSchema().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});

