-- Verification: Check that RLS is enabled on all tables
-- Run this after applying the migration

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

