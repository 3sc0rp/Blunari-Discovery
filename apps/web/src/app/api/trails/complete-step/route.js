import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";
import {
  applyStampRewards,
  addXp,
  recalculateBadgesForUser,
} from "@/app/api/utils/xp";
import { logEvent } from "@/app/api/utils/appEvents";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const key = `${getClientKey(request)}:trails:complete:${userId}`;
    const rl = rateLimit({ key, limit: 120, windowMs: 60_000 });
    if (!rl.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { trailId, stepId, slug, idempotencyKey } = body || {};

    // Resolve trail
    let trailRows;
    if (trailId) {
      trailRows = await sql(
        `SELECT id, title, slug, badge_id
         FROM trails
         WHERE id = $1 AND COALESCE(is_published, false) = true
         LIMIT 1`,
        [Number(trailId)],
      );
    } else if (slug) {
      trailRows = await sql(
        `SELECT id, title, slug, badge_id
         FROM trails
         WHERE slug = $1 AND COALESCE(is_published, false) = true
         LIMIT 1`,
        [String(slug).toLowerCase()],
      );
    } else {
      return Response.json(
        { error: "Provide trailId or slug" },
        { status: 400 },
      );
    }

    const trail = trailRows?.[0];
    if (!trail) {
      return Response.json({ error: "Trail not found" }, { status: 404 });
    }

    if (!stepId) {
      return Response.json({ error: "Missing stepId" }, { status: 400 });
    }

    // Optional idempotency: if duplicate key, short-circuit with current progress
    if (idempotencyKey) {
      try {
        const ins = await sql(
          `INSERT INTO idempotency_keys (key, user_id)
           VALUES ($1, $2)
           ON CONFLICT (key) DO NOTHING
           RETURNING key`,
          [String(idempotencyKey), userId],
        );
        if (!ins?.[0]) {
          // already processed; return current progress and status
          const [doneRows, totalRows, likedRows] = await sql.transaction(
            (txn) => [
              txn(
                `SELECT COUNT(*)::int AS done FROM trail_step_completions WHERE trail_id = $1 AND user_id = $2`,
                [trail.id, userId],
              ),
              txn(
                `SELECT COUNT(*)::int AS total FROM trail_steps WHERE trail_id = $1`,
                [trail.id],
              ),
              txn(
                `SELECT 1 FROM trail_step_completions WHERE step_id = $1 AND user_id = $2 LIMIT 1`,
                [Number(stepId), userId],
              ),
            ],
          );
          const done = doneRows?.[0]?.done ?? 0;
          const total = totalRows?.[0]?.total ?? 0;
          return Response.json({
            ok: true,
            firstStepCompletion: Boolean(likedRows?.[0]),
            stamped: null,
            stampRewards: null,
            trail: { id: trail.id, slug: trail.slug },
            progress: { total, done },
            trailJustCompleted: total > 0 && done >= total,
            trailRewards: null,
            idempotent: true,
          });
        }
      } catch (_e) {
        // ignore errors and continue
      }
    }

    // Validate step belongs to trail and get restaurant
    const stepRows = await sql(
      `SELECT s.id, s.trail_id, s.restaurant_id, s.order_index
       FROM trail_steps s
       WHERE s.id = $1 AND s.trail_id = $2
       LIMIT 1`,
      [Number(stepId), trail.id],
    );

    const step = stepRows?.[0];
    if (!step) {
      return Response.json(
        { error: "Step not found for trail" },
        { status: 400 },
      );
    }

    // Idempotent completion insert
    const completedInsert = await sql(
      `INSERT INTO trail_step_completions (trail_id, step_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, step_id) DO NOTHING
       RETURNING id, completed_at`,
      [trail.id, step.id, userId],
    );

    const firstStepCompletion = Boolean(completedInsert?.[0]);

    // Ensure a restaurant stamp exists; if newly inserted, award stamp rewards
    const stampInsert = await sql(
      `INSERT INTO restaurant_stamps (user_id, restaurant_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, restaurant_id) DO NOTHING
       RETURNING id`,
      [userId, step.restaurant_id],
    );

    let stampRewards = null;
    if (stampInsert?.[0]) {
      // Log passport stamp from manual/trail flow
      await logEvent({
        userId,
        eventType: "passport_stamp",
        source: "manual",
        entityId: step.restaurant_id,
      });
      try {
        stampRewards = await applyStampRewards(userId, step.restaurant_id);
      } catch (e) {
        console.error("applyStampRewards failed", e);
      }
    }

    // Check if trail completed by this user now
    const [totalRows, doneRows] = await sql.transaction((txn) => [
      txn(
        `SELECT COUNT(*)::int AS total FROM trail_steps WHERE trail_id = $1`,
        [trail.id],
      ),
      txn(
        `SELECT COUNT(*)::int AS done
         FROM trail_step_completions
         WHERE trail_id = $1 AND user_id = $2`,
        [trail.id, userId],
      ),
    ]);

    const total = totalRows?.[0]?.total ?? 0;
    const done = doneRows?.[0]?.done ?? 0;

    let trailJustCompleted = false;
    let trailXp = 0;
    let trailXpResult = null;
    let trailBadgeAwarded = null;

    if (total > 0 && done >= total) {
      const trailCompletion = await sql(
        `INSERT INTO trail_completions (trail_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, trail_id) DO NOTHING
         RETURNING id`,
        [trail.id, userId],
      );

      if (trailCompletion?.[0]) {
        trailJustCompleted = true;
        // Log trail completion event
        await logEvent({
          userId,
          eventType: "trail_complete",
          entityId: trail.id,
          metadata: { slug: trail.slug },
        });
        // Award +50 XP once per trail completion
        trailXp = 50;
        try {
          trailXpResult = await addXp(userId, trailXp);
        } catch (e) {
          console.error("addXp for trail completion failed", e);
        }
        // Award configured badge if any
        if (Number.isInteger(trail.badge_id)) {
          const badgeInsert = await sql(
            `INSERT INTO user_badge (user_id, badge_id)
             SELECT $1, $2
             WHERE NOT EXISTS (
               SELECT 1 FROM user_badge WHERE user_id = $1 AND badge_id = $2
             )
             RETURNING badge_id`,
            [userId, trail.badge_id],
          );
          if (badgeInsert?.[0]) {
            const bRows = await sql(
              `SELECT id, slug, name, description, icon FROM badge WHERE id = $1`,
              [trail.badge_id],
            );
            trailBadgeAwarded = bRows?.[0] || { id: trail.badge_id };
          }
        }
        // Recalculate other rule-based badges
        try {
          await recalculateBadgesForUser(userId);
        } catch (e) {
          console.error("recalculateBadgesForUser failed", e);
        }
      }
    }

    return Response.json({
      ok: true,
      firstStepCompletion,
      stamped: Boolean(stampInsert?.[0]),
      stampRewards: stampRewards || null,
      trail: { id: trail.id, slug: trail.slug },
      progress: { total, done },
      trailJustCompleted,
      trailRewards: trailJustCompleted
        ? {
            xpAdded: trailXp,
            xp: trailXpResult?.after?.xp ?? null,
            level: trailXpResult?.after?.level ?? null,
            justLeveledUp: !!trailXpResult?.justLeveledUp,
            badge: trailBadgeAwarded,
          }
        : null,
    });
  } catch (err) {
    console.error("POST /api/trails/complete-step error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
