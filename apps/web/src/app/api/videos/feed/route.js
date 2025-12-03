import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

function toInt(v, d = 20, min = 1, max = 100) {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export async function GET(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;

    const { searchParams } = new URL(request.url);
    const limit = toInt(searchParams.get("limit"), 20, 1, 50);

    // Simple feed ranking: newest first, then engagement score
    const rows = await sql(
      `WITH likes AS (
         SELECT video_id, COUNT(*)::int AS like_count FROM video_likes GROUP BY video_id
       ),
       views AS (
         SELECT video_id, COUNT(*)::int AS view_count FROM video_events WHERE event_type = 'view' GROUP BY video_id
       ),
       shares AS (
         SELECT video_id, COUNT(*)::int AS share_count FROM video_events WHERE event_type = 'share' GROUP BY video_id
       )
       SELECT 
         v.id,
         v.video_url,
         v.caption,
         v.created_at,
         v.restaurant_id,
         r.name AS restaurant_name,
         r.slug AS restaurant_slug,
         c.country,
         c.city,
         COALESCE(like_count, 0) AS likes,
         COALESCE(view_count, 0) AS views,
         COALESCE(share_count, 0) AS shares,
         CASE WHEN $1::text IS NULL THEN false
              ELSE EXISTS (SELECT 1 FROM video_likes vl WHERE vl.video_id = v.id AND vl.user_id = $1)
         END AS liked,
         CASE WHEN $1::text IS NULL THEN false
              ELSE EXISTS (SELECT 1 FROM favorite f WHERE f.restaurant_id = v.restaurant_id AND f.user_id = $1)
         END AS favorited,
         CASE WHEN $1::text IS NULL THEN false
              ELSE EXISTS (SELECT 1 FROM restaurant_stamps s WHERE s.restaurant_id = v.restaurant_id AND s.user_id = $1)
         END AS stamped
       FROM videos v
       JOIN restaurant r ON r.id = v.restaurant_id
       JOIN city c ON c.id = r.city_id
       LEFT JOIN likes l ON l.video_id = v.id
       LEFT JOIN views vw ON vw.video_id = v.id
       LEFT JOIN shares sh ON sh.video_id = v.id
       WHERE v.is_published = true AND COALESCE(r.published, false) = true
       ORDER BY v.created_at DESC, (COALESCE(like_count,0) * 3 + COALESCE(share_count,0) * 2 + COALESCE(view_count,0)) DESC
       LIMIT $2`,
      [userId, limit],
    );

    const isAnon = !userId;
    const headers = isAnon
      ? {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "Content-Type": "application/json",
        }
      : { "Cache-Control": "no-store", "Content-Type": "application/json" };

    return new Response(JSON.stringify({ videos: rows || [] }), {
      headers,
    });
  } catch (err) {
    console.error("GET /api/videos/feed error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  }
}
