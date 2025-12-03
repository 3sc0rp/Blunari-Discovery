import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

const ALLOWED = new Set(["view", "share", "complete"]);

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;

    const key = `${getClientKey(request)}:video-event:${userId ?? "anon"}`;
    const rl = rateLimit({ key, limit: 120, windowMs: 60_000 });
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
    const type = String(body?.type || "").toLowerCase();
    const metadata =
      body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

    if (!Number.isFinite(videoId)) {
      return new Response(JSON.stringify({ error: "Invalid video_id" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    if (!ALLOWED.has(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Ensure video exists & published
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

    // Debounce views per user/IP per 30 seconds
    if (type === "view") {
      const recent = await sql(
        `SELECT id FROM video_events
         WHERE video_id = $1 AND ($2::text IS NULL OR user_id = $2) AND event_type = 'view' AND created_at > now() - interval '30 seconds'
         ORDER BY created_at DESC LIMIT 1`,
        [videoId, userId],
      );
      if (recent?.[0]) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      }
    }

    const ua = request.headers.get("user-agent") || undefined;
    const ref = request.headers.get("referer") || undefined;
    const meta = { ...(metadata || {}), ua, ref };

    await sql(
      `INSERT INTO video_events (video_id, user_id, event_type, metadata)
       VALUES ($1, $2, $3, $4)`,
      [videoId, userId, type, meta],
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/videos/event error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
