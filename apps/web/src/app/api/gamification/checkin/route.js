import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { logEvent } from "@/app/api/utils/appEvents";

function isValidInteger(value) {
  return (
    Number.isInteger(value) ||
    (typeof value === "string" && /^\d+$/.test(value))
  );
}

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let { restaurant_id, slug, country, city } = body || {};

    let restaurantId = null;
    let cityId = null;

    if (isValidInteger(restaurant_id)) {
      const rows = await sql(
        "SELECT id, city_id FROM restaurant WHERE id = $1 LIMIT 1",
        [Number(restaurant_id)],
      );
      if (!rows?.[0]) {
        return Response.json(
          { error: "Restaurant not found" },
          { status: 404 },
        );
      }
      restaurantId = rows[0].id;
      cityId = rows[0].city_id || null;
    } else if (slug && country && city) {
      const rows = await sql(
        "SELECT r.id, r.city_id FROM restaurant r JOIN city c ON c.id = r.city_id WHERE c.country = $1 AND c.city = $2 AND r.slug = $3 LIMIT 1",
        [
          String(country).toLowerCase(),
          String(city).toLowerCase(),
          String(slug).toLowerCase(),
        ],
      );
      if (!rows?.[0]) {
        return Response.json(
          { error: "Restaurant not found for slug" },
          { status: 404 },
        );
      }
      restaurantId = rows[0].id;
      cityId = rows[0].city_id || null;
    } else {
      return Response.json(
        { error: "Provide restaurant_id or {slug, country, city}" },
        { status: 400 },
      );
    }

    // Attempt to insert a check-in for today (idempotent by unique constraint)
    const inserted = await sql(
      "INSERT INTO checkin (user_id, restaurant_id, city_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, restaurant_id, day) DO NOTHING RETURNING day",
      [userId, restaurantId, cityId],
    );

    const createdToday = Boolean(inserted?.[0]);
    const todayStr = inserted?.[0]?.day || null;

    // Log passport stamp event for check-in only when newly created
    if (createdToday) {
      await logEvent({
        userId,
        eventType: "passport_stamp",
        source: "checkin",
        entityId: restaurantId,
        metadata: { day: todayStr },
      });
    }

    // Award XP only if a new check-in was created today
    let profile = null;
    // additions: track quest and badge results
    let questProgress = [];
    let badgesAwarded = [];
    if (createdToday) {
      const refId = `${restaurantId}:${todayStr || "today"}`;
      // Insert an XP event (idempotent by constraint)
      await sql(
        "INSERT INTO xp_event (user_id, type, points, ref_type, ref_id) VALUES ($1, 'checkin', 10, 'restaurant', $2) ON CONFLICT (user_id, type, ref_type, ref_id) DO NOTHING",
        [userId, refId],
      );

      // Upsert and update the profile with new XP and streak safely
      const rows = await sql(
        `INSERT INTO user_profile (user_id, xp, level, total_checkins, streak_checkins, last_checkin_date, created_at, updated_at)
         VALUES ($1, 10, 1, 1, 1, CURRENT_DATE, now(), now())
         ON CONFLICT (user_id) DO UPDATE SET
           xp = user_profile.xp + 10,
           level = ((user_profile.xp + 10) / 100)::int + 1,
           total_checkins = user_profile.total_checkins + 1,
           streak_checkins = CASE WHEN user_profile.last_checkin_date = CURRENT_DATE - INTERVAL '1 day' THEN user_profile.streak_checkins + 1 ELSE 1 END,
           last_checkin_date = CURRENT_DATE,
           updated_at = now()
         RETURNING *`,
        [userId],
      );
      profile = rows?.[0] || null;

      // === NEW: Ensure user is enrolled in applicable quests, then progress them ===
      // 1) Enroll user in all active check-in quests if not already present
      await sql(
        `INSERT INTO user_quest (user_id, quest_id, progress, status, created_at, updated_at)
         SELECT $1, q.id, 0, 'active', now(), now()
         FROM quest q
         WHERE q.active = true AND q.kind IN ('checkin','checkins')
         ON CONFLICT (user_id, quest_id) DO NOTHING`,
        [userId],
      );

      // 2) Progress active check-in quests by +1 and complete those that hit target
      const progressed = await sql(
        `UPDATE user_quest uq
         SET progress = uq.progress + 1,
             status = CASE WHEN uq.progress + 1 >= q.target THEN 'completed' ELSE uq.status END,
             updated_at = now()
         FROM quest q
         WHERE uq.user_id = $1 AND uq.quest_id = q.id AND uq.status = 'active' AND q.active = true AND q.kind IN ('checkin','checkins')
         RETURNING uq.id, uq.quest_id, uq.progress, uq.status`,
        [userId],
      );
      questProgress = progressed || [];

      // 3) Award badges based on total_checkins threshold in badge.thresholds->>'checkins'
      if (profile && Number.isInteger(profile.total_checkins)) {
        const available = await sql(
          `SELECT id FROM badge
           WHERE active = true
             AND (thresholds->>'checkins') IS NOT NULL
             AND (thresholds->>'checkins')::int <= $1`,
          [profile.total_checkins],
        );
        if (available && available.length) {
          // Insert all eligible user_badge rows (ignore duplicates)
          const values = [];
          const placeholders = [];
          let i = 1;
          for (const b of available) {
            placeholders.push(`($${i++}, $${i++})`);
            values.push(userId, b.id);
          }
          await sql(
            `INSERT INTO user_badge (user_id, badge_id) VALUES ${placeholders.join(", ")}
             ON CONFLICT (user_id, badge_id) DO NOTHING`,
            values,
          );
          badgesAwarded = available.map((b) => ({ badge_id: b.id }));
        }
      }
    } else {
      const rows = await sql("SELECT * FROM user_profile WHERE user_id = $1", [
        userId,
      ]);
      profile = rows?.[0] || null;
    }

    return Response.json({
      ok: true,
      checkedIn: createdToday,
      profile,
      questProgress,
      badgesAwarded,
    });
  } catch (err) {
    console.error("POST /api/gamification/checkin error", err);
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
