import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";
import { applyStampRewards } from "@/app/api/utils/xp";
import { logEvent } from "@/app/api/utils/appEvents";

function isValidInteger(value) {
  return (
    Number.isInteger(value) ||
    (typeof value === "string" && /^\d+$/.test(value))
  );
}

export async function GET(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return new Response(JSON.stringify({ stamps: [] }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.max(
      1,
      Math.min(Number(searchParams.get("limit") || 200), 1000),
    );

    const rows = await sql(
      `SELECT s.restaurant_id, s.first_stamped_at
       FROM restaurant_stamps s
       WHERE s.user_id = $1
       ORDER BY s.first_stamped_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return new Response(JSON.stringify({ stamps: rows || [] }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/blunari/stamps error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const key = `${getClientKey(request)}:stamps:post:${userId}`;
    const rl = rateLimit({ key, limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const body = await request.json().catch(() => ({}));
    let { restaurant_id, slug, country, city } = body || {};

    let restaurantId = null;

    if (isValidInteger(restaurant_id)) {
      const rows = await sql(
        "SELECT id FROM restaurant WHERE id = $1 LIMIT 1",
        [Number(restaurant_id)],
      );
      if (!rows?.[0]) {
        return new Response(JSON.stringify({ error: "Restaurant not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      }
      restaurantId = rows[0].id;
    } else if (slug && country && city) {
      const rows = await sql(
        `SELECT r.id
         FROM restaurant r
         JOIN city c ON c.id = r.city_id
         WHERE c.country = $1 AND c.city = $2 AND r.slug = $3 AND coalesce(r.published, false) = true
         LIMIT 1`,
        [
          String(country).toLowerCase(),
          String(city).toLowerCase(),
          String(slug).toLowerCase(),
        ],
      );
      if (!rows?.[0]) {
        return new Response(
          JSON.stringify({ error: "Restaurant not found for slug" }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        );
      }
      restaurantId = rows[0].id;
    } else {
      return new Response(
        JSON.stringify({
          error: "Provide restaurant_id or {slug, country, city}",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // Idempotent insert
    const inserted = await sql(
      `INSERT INTO restaurant_stamps (user_id, restaurant_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, restaurant_id) DO NOTHING
       RETURNING id, first_stamped_at`,
      [userId, restaurantId],
    );

    const firstTime = Boolean(inserted?.[0]);

    let rewards = null;
    if (firstTime) {
      // Log passport stamp from manual action
      await logEvent({
        userId,
        eventType: "passport_stamp",
        source: "manual",
        entityId: restaurantId,
      });
      try {
        rewards = await applyStampRewards(userId, restaurantId);
      } catch (e) {
        console.error("applyStampRewards failed", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, firstTime, ...(rewards || {}) }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("POST /api/blunari/stamps error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
