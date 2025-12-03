-- Migration: Enable RLS and add comprehensive security policies
-- This migration makes Supabase the secure, primary database
-- Run date: 2024-12
-- SAFE: Can be rolled back by disabling RLS

-- ============================================================================
-- PART 1: ENABLE RLS ON ALL USER-OWNED TABLES
-- ============================================================================

-- User tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badge ENABLE ROW LEVEL SECURITY;

-- User activity tables
ALTER TABLE IF EXISTS restaurant_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorite ENABLE ROW LEVEL SECURITY;

-- Gamification tables
ALTER TABLE IF EXISTS xp_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_quest ENABLE ROW LEVEL SECURITY;

-- Drop claims
ALTER TABLE IF EXISTS daily_drop_claims ENABLE ROW LEVEL SECURITY;

-- Trail completions
ALTER TABLE IF EXISTS trail_step_completions ENABLE ROW LEVEL SECURITY;

-- Social tables
ALTER TABLE IF EXISTS video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_events ENABLE ROW LEVEL SECURITY;

-- Referral tables
ALTER TABLE IF EXISTS referral_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_claim ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_events ENABLE ROW LEVEL SECURITY;

-- Events
ALTER TABLE IF EXISTS app_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: USER TABLE POLICIES
-- ============================================================================

-- users: Users can read own profile, service role can manage all
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_all_users" ON users;
CREATE POLICY "service_role_all_users" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 3: USER_PROFILE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "user_profile_select_own" ON user_profile;
CREATE POLICY "user_profile_select_own" ON user_profile
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profile_update_own" ON user_profile;
CREATE POLICY "user_profile_update_own" ON user_profile
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_user_profile" ON user_profile;
CREATE POLICY "service_role_all_user_profile" ON user_profile
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 4: RESTAURANT_STAMPS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "restaurant_stamps_select_own" ON restaurant_stamps;
CREATE POLICY "restaurant_stamps_select_own" ON restaurant_stamps
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "restaurant_stamps_insert_own" ON restaurant_stamps;
CREATE POLICY "restaurant_stamps_insert_own" ON restaurant_stamps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_restaurant_stamps" ON restaurant_stamps;
CREATE POLICY "service_role_all_restaurant_stamps" ON restaurant_stamps
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 5: CHECKIN POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "checkin_select_own" ON checkin;
CREATE POLICY "checkin_select_own" ON checkin
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "checkin_insert_own" ON checkin;
CREATE POLICY "checkin_insert_own" ON checkin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_checkin" ON checkin;
CREATE POLICY "service_role_all_checkin" ON checkin
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 6: FAVORITE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "favorite_select_own" ON favorite;
CREATE POLICY "favorite_select_own" ON favorite
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorite_insert_own" ON favorite;
CREATE POLICY "favorite_insert_own" ON favorite
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorite_delete_own" ON favorite;
CREATE POLICY "favorite_delete_own" ON favorite
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_favorite" ON favorite;
CREATE POLICY "service_role_all_favorite" ON favorite
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 7: XP_EVENT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "xp_event_select_own" ON xp_event;
CREATE POLICY "xp_event_select_own" ON xp_event
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_xp_event" ON xp_event;
CREATE POLICY "service_role_all_xp_event" ON xp_event
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 8: USER_BADGE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "user_badge_select_own" ON user_badge;
CREATE POLICY "user_badge_select_own" ON user_badge
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_user_badge" ON user_badge;
CREATE POLICY "service_role_all_user_badge" ON user_badge
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 9: USER_QUEST POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "user_quest_select_own" ON user_quest;
CREATE POLICY "user_quest_select_own" ON user_quest
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_user_quest" ON user_quest;
CREATE POLICY "service_role_all_user_quest" ON user_quest
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 10: DAILY_DROP_CLAIMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "daily_drop_claims_select_own" ON daily_drop_claims;
CREATE POLICY "daily_drop_claims_select_own" ON daily_drop_claims
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_drop_claims_insert_own" ON daily_drop_claims;
CREATE POLICY "daily_drop_claims_insert_own" ON daily_drop_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_daily_drop_claims" ON daily_drop_claims;
CREATE POLICY "service_role_all_daily_drop_claims" ON daily_drop_claims
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 11: TRAIL_STEP_COMPLETIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "trail_step_completions_select_own" ON trail_step_completions;
CREATE POLICY "trail_step_completions_select_own" ON trail_step_completions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trail_step_completions_insert_own" ON trail_step_completions;
CREATE POLICY "trail_step_completions_insert_own" ON trail_step_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_trail_step_completions" ON trail_step_completions;
CREATE POLICY "service_role_all_trail_step_completions" ON trail_step_completions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 12: VIDEO_LIKES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "video_likes_select_own" ON video_likes;
CREATE POLICY "video_likes_select_own" ON video_likes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "video_likes_insert_own" ON video_likes;
CREATE POLICY "video_likes_insert_own" ON video_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "video_likes_delete_own" ON video_likes;
CREATE POLICY "video_likes_delete_own" ON video_likes
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_video_likes" ON video_likes;
CREATE POLICY "service_role_all_video_likes" ON video_likes
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 13: VIDEO_EVENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "video_events_select_own" ON video_events;
CREATE POLICY "video_events_select_own" ON video_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "video_events_insert_own" ON video_events;
CREATE POLICY "video_events_insert_own" ON video_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_video_events" ON video_events;
CREATE POLICY "service_role_all_video_events" ON video_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 14: REFERRAL_CODE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "referral_code_select_own" ON referral_code;
CREATE POLICY "referral_code_select_own" ON referral_code
  FOR SELECT
  USING (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "service_role_all_referral_code" ON referral_code;
CREATE POLICY "service_role_all_referral_code" ON referral_code
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 15: REFERRAL_CLAIM POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "referral_claim_select_own" ON referral_claim;
CREATE POLICY "referral_claim_select_own" ON referral_claim
  FOR SELECT
  USING (auth.uid() = referee_user_id);

DROP POLICY IF EXISTS "service_role_all_referral_claim" ON referral_claim;
CREATE POLICY "service_role_all_referral_claim" ON referral_claim
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 16: REFERRAL_EVENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "referral_events_select_own" ON referral_events;
CREATE POLICY "referral_events_select_own" ON referral_events
  FOR SELECT
  USING (auth.uid() = inviter_user_id OR auth.uid() = referred_user_id);

DROP POLICY IF EXISTS "service_role_all_referral_events" ON referral_events;
CREATE POLICY "service_role_all_referral_events" ON referral_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 17: APP_EVENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "app_events_select_own" ON app_events;
CREATE POLICY "app_events_select_own" ON app_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_all_app_events" ON app_events;
CREATE POLICY "service_role_all_app_events" ON app_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PUBLIC/READ-ONLY TABLES (No RLS needed, but enabled for consistency)
-- ============================================================================

-- city, restaurant, restaurant_images, list, list_entry, badge, quest, trails, 
-- trail_steps, daily_drops, videos - These are public content

-- Enable RLS but allow public read
ALTER TABLE IF EXISTS city ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "city_select_all" ON city;
CREATE POLICY "city_select_all" ON city FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_role_all_city" ON city;
CREATE POLICY "service_role_all_city" ON city FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS restaurant ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "restaurant_select_published" ON restaurant;
CREATE POLICY "restaurant_select_published" ON restaurant FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "service_role_all_restaurant" ON restaurant;
CREATE POLICY "service_role_all_restaurant" ON restaurant FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS restaurant_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "restaurant_images_select_published" ON restaurant_images;
CREATE POLICY "restaurant_images_select_published" ON restaurant_images FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "service_role_all_restaurant_images" ON restaurant_images;
CREATE POLICY "service_role_all_restaurant_images" ON restaurant_images FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "list_select_published" ON list;
CREATE POLICY "list_select_published" ON list FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "service_role_all_list" ON list;
CREATE POLICY "service_role_all_list" ON list FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS list_entry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "list_entry_select_all" ON list_entry;
CREATE POLICY "list_entry_select_all" ON list_entry FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_role_all_list_entry" ON list_entry;
CREATE POLICY "service_role_all_list_entry" ON list_entry FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS badge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badge_select_active" ON badge;
CREATE POLICY "badge_select_active" ON badge FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "service_role_all_badge" ON badge;
CREATE POLICY "service_role_all_badge" ON badge FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS quest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quest_select_active" ON quest;
CREATE POLICY "quest_select_active" ON quest FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "service_role_all_quest" ON quest;
CREATE POLICY "service_role_all_quest" ON quest FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS trails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trails_select_published" ON trails;
CREATE POLICY "trails_select_published" ON trails FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "service_role_all_trails" ON trails;
CREATE POLICY "service_role_all_trails" ON trails FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS trail_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trail_steps_select_all" ON trail_steps;
CREATE POLICY "trail_steps_select_all" ON trail_steps FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_role_all_trail_steps" ON trail_steps;
CREATE POLICY "service_role_all_trail_steps" ON trail_steps FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS daily_drops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_drops_select_published" ON daily_drops;
CREATE POLICY "daily_drops_select_published" ON daily_drops FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "service_role_all_daily_drops" ON daily_drops;
CREATE POLICY "service_role_all_daily_drops" ON daily_drops FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "videos_select_published" ON videos;
CREATE POLICY "videos_select_published" ON videos FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "service_role_all_videos" ON videos;
CREATE POLICY "service_role_all_videos" ON videos FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- To rollback: Run supabase/migrations/00001_rollback_rls.sql

