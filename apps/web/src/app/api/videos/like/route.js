import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

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

    const key = `${getClientKey(request)}:video-like:${userId}`;
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
    const videoId = Number(body?.video_id);
    const idempotencyKey = body?.idempotencyKey
      ? String(body.idempotencyKey)
      : null;
    if (!Number.isFinite(videoId)) {
      return new Response(JSON.stringify({ error: "Invalid video_id" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Verify video exists and is published
    const exists = await sql(
      "SELECT id FROM videos WHERE id = $1 AND is_published = true LIMIT 1",
      [videoId],
    );
    if (!exists?.[0]) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Optional idempotency: if provided and already seen, return current state without toggling
    if (idempotencyKey) {
      try {
        const ins = await sql(
          `INSERT INTO idempotency_keys (key, user_id)
           VALUES ($1, $2)
           ON CONFLICT (key) DO NOTHING
           RETURNING key`,
          [idempotencyKey, userId],
        );
        if (!ins?.[0]) {
          // duplicate key -> just read current like state
          const likedRows = await sql(
            `SELECT 1 FROM video_likes WHERE video_id = $1 AND user_id = $2 LIMIT 1`,
            [videoId, userId],
          );
          const countRows = await sql(
            `SELECT COUNT(*)::int AS likes FROM video_likes WHERE video_id = $1`,
            [videoId],
          );
          return new Response(
            JSON.stringify({
              ok: true,
              liked: Boolean(likedRows?.[0]),
              likes: countRows?.[0]?.likes ?? 0,
              idempotent: true,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        }
      } catch (_e) {
        // ignore idempotency errors, proceed normally
      }
    }

    // Try to like; if already liked, unlike instead
    const inserted = await sql(
      `INSERT INTO video_likes (video_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, video_id) DO NOTHING
       RETURNING video_id`,
      [videoId, userId],
    );

    let liked = false;
    let eventType = "like";
    if (inserted?.[0]) {
      liked = true;
    } else {
      await sql(
        "DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2",
        [videoId, userId],
      );
      eventType = "unlike";
    }

    // Log event
    try {
      await sql(
        `INSERT INTO video_events (video_id, user_id, event_type)
         VALUES ($1, $2, $3)`,
        [videoId, userId, eventType],
      );
    } catch (e) {
      console.error("video like event log failed", e);
    }

    const counts = await sql(
      `SELECT COUNT(*)::int AS likes FROM video_likes WHERE video_id = $1`,
      [videoId],
    );

    return new Response(
      JSON.stringify({ ok: true, liked, likes: counts?.[0]?.likes ?? 0 }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("POST /api/videos/like error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
