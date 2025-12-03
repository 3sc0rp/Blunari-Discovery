/**
 * Supabase Server Client
 * 
 * This is the NEW database client for all API routes.
 * Replaces the Neon sql() client with Supabase Postgres.
 * 
 * Usage in API routes:
 * 
 *   import { createServerClient } from '@/app/api/utils/supabase-server';
 *   
 *   const supabase = createServerClient();
 *   const { data, error } = await supabase
 *     .from('users')
 *     .select('*')
 *     .eq('id', userId)
 *     .single();
 * 
 * For raw SQL queries:
 * 
 *   import { querySql } from '@/app/api/utils/supabase-server';
 *   
 *   const result = await querySql(
 *     'SELECT * FROM users WHERE id = $1',
 *     [userId]
 *   );
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://arlgghjxeffmeqblkucz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY. Database operations will fail.');
}

/**
 * Create a server-side Supabase client.
 * Uses service_role key to bypass RLS (safe for API routes).
 */
export function createServerClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Execute raw SQL on Supabase Postgres.
 * Returns array of rows (matches Neon's sql() interface).
 * 
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of result rows
 */
export async function querySql(query, params = []) {
  const supabase = createServerClient();
  
  // Convert $1, $2 to Supabase's rpc format
  // Note: Supabase doesn't natively support parameterized raw SQL
  // We use the PostgREST direct query (requires pg extension)
  
  // For now, use the ORM. For complex queries, we'll need a different approach.
  throw new Error('querySql not yet implemented. Use Supabase ORM methods instead.');
}

/**
 * Supabase transaction helper (uses Postgres transactions via RPC)
 * Note: Supabase JS doesn't have built-in transaction support like Neon.
 * For complex transactions, consider using pg client directly.
 */
export async function transaction(callback) {
  // Supabase doesn't support transactions in the same way as Neon
  // For critical operations, we'll need to use the pg client
  throw new Error('Transactions require direct pg client. Use createPgClient() instead.');
}

/**
 * Legacy compatibility layer - Use Supabase client instead when possible
 */

/**
 * Helper: Check if a table exists in Supabase
 */
export async function tableExists(tableName) {
  const supabase = createServerClient();
  const { error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
  return !error;
}

