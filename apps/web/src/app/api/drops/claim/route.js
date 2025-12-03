import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { applyStampRewards } from "@/app/api/utils/xp";
import { logEvent } from "@/app/api/utils/appEvents";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  const userId = String(session.user.id);

  // Basic rate limit: claims per minute per user/IP
  const key = `${getClientKey(request)}:drop-claim:${userId}`;
  const rl = rateLimit({ key, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  const dropId = body?.dropId;
  const idempotencyKey = body?.idempotencyKey
    ? String(body.idempotencyKey)
    : null;
  if (!dropId || isNaN(Number(dropId))) {
    return new Response(JSON.stringify({ error: "dropId is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    let trailRewards = null;

    // Updated: optional idempotency-key support inside a transaction
    const result = await sql.transaction(async (txn) => {
      // If provided, try to record the idempotency key. If it already exists for this user, we will short-circuit.
      let idempotentRepeat = false;
      if (idempotencyKey) {
        try {
          const idkInsert = await txn(
            `INSERT INTO idempotency_keys (key, user_id)
             VALUES ($1, $2)
             ON CONFLICT (key) DO NOTHING
             RETURNING key`,
            [idempotencyKey, userId],
          );
          if (!idkInsert?.[0]) {
            idempotentRepeat = true;
          }
        } catch (e) {
          // If the table does not exist or any error occurs, we ignore and proceed without idempotency.
          // This keeps UX safe while allowing rollout before migrations are applied.
        }
      }

      // Lock the drop row to serialize capacity checks
      const dropRows = await txn(
        `SELECT id, restaurant_id, title, description, starts_at, ends_at, capacity, is_published
         FROM daily_drops
         WHERE id = $1
         FOR UPDATE`,
        [dropId],
      );
      const drop = dropRows?.[0];
      if (!drop) {
        return { status: 404, payload: { error: "Drop not found" } };
      }
      const nowRows = await txn("SELECT now() as now");
      const now = nowRows?.[0]?.now ? new Date(nowRows[0].now) : new Date();

      if (!drop.is_published) {
        return { status: 400, payload: { error: "Drop is not available" } };
      }
      if (!(new Date(drop.starts_at) <= now && now < new Date(drop.ends_at))) {
        return { status: 400, payload: { error: "Drop is not active" } };
      }

      // Already claimed?
      const prior = await txn(
        `SELECT id, claimed_at FROM daily_drop_claims WHERE drop_id = $1 AND user_id = $2`,
        [dropId, userId],
      );
      if (prior?.[0]) {
        const usedRows = await txn(
          `SELECT COUNT(*)::int AS used FROM daily_drop_claims WHERE drop_id = $1`,
          [dropId],
        );
        const used = usedRows?.[0]?.used ?? 0;
        const remaining = Math.max(0, (drop.capacity || 0) - used);
        return {
          status: 200,
          payload: {
            ok: true,
            claimed: false,
            alreadyClaimed: true,
            slotsRemaining: remaining,
          },
        };
      }

      // If this is a repeat idempotency key call and user has not claimed, return a safe read-only status
      if (idempotentRepeat) {
        const usedRows = await txn(
          `SELECT COUNT(*)::int AS used FROM daily_drop_claims WHERE drop_id = $1`,
          [dropId],
        );
        const used = usedRows?.[0]?.used ?? 0;
        const remaining = Math.max(0, (drop.capacity || 0) - used);
        return {
          status: 200,
          payload: {
            ok: true,
            claimed: false,
            alreadyClaimed: false,
            slotsRemaining: remaining,
          },
        };
      }

      // Capacity check
      const usedRows = await txn(
        `SELECT COUNT(*)::int AS used FROM daily_drop_claims WHERE drop_id = $1`,
        [dropId],
      );
      const used = usedRows?.[0]?.used ?? 0;
      if (used >= (drop.capacity || 0)) {
        return { status: 409, payload: { error: "sold_out" } };
      }

      // Insert claim
      const claimInsert = await txn(
        `INSERT INTO daily_drop_claims (drop_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, drop_id) DO NOTHING
         RETURNING id`,
        [dropId, userId],
      );

      // Ensure stamp (idempotent)
      const stamp = await txn(
        `INSERT INTO restaurant_stamps (user_id, restaurant_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, restaurant_id) DO NOTHING
         RETURNING id`,
        [userId, drop.restaurant_id],
      );

      return {
        status: 200,
        payload: {
          ok: true,
          claimed: true,
          newlyClaimed: !!claimInsert?.[0],
          firstStamp: !!stamp?.[0],
          restaurantId: drop.restaurant_id,
        },
      };
    });

    if (result?.status !== 200) {
      return new Response(
        JSON.stringify(result?.payload || { error: "Claim failed" }),
        {
          status: result?.status || 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // If the stamp was first-time, award XP/badges outside the lock
    let rewards = null;
    if (result?.payload?.firstStamp && result?.payload?.restaurantId) {
      try {
        rewards = await applyStampRewards(userId, result.payload.restaurantId);
      } catch (e) {
        console.error("applyStampRewards error", e);
      }
      // Log passport stamp from drop flow
      await logEvent({
        userId,
        eventType: "passport_stamp",
        source: "drop",
        entityId: result.payload.restaurantId,
      });
    }

    // Log the drop claim only if it was newly inserted
    if (result?.payload?.newlyClaimed) {
      await logEvent({
        userId,
        eventType: "drop_claim",
        entityId: String(dropId),
      });
    }

    // Return final state with refreshed remaining slots
    const remainingRows = await sql(
      `SELECT capacity - COUNT(c.id)::int AS remaining
       FROM daily_drops d
       LEFT JOIN daily_drop_claims c ON c.drop_id = d.id
       WHERE d.id = $1
       GROUP BY d.capacity`,
      [dropId],
    );
    const slotsRemaining = Math.max(0, remainingRows?.[0]?.remaining ?? 0);

    return new Response(
      JSON.stringify({
        ok: true,
        claimed: true,
        slotsRemaining,
        ...(rewards || {}),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("/api/drops/claim POST error", err);
    return new Response(JSON.stringify({ error: "Failed to claim drop" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
