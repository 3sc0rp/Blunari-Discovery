import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET() {
  try {
    await requireAdmin();

    // app_events daily counts (last 30 days)
    const appEventsDaily = await sql(
      `SELECT date_trunc('day', created_at)::date AS day,
              SUM(CASE WHEN event_type = 'signup' THEN 1 ELSE 0 END)::int AS signup,
              SUM(CASE WHEN event_type = 'passport_stamp' THEN 1 ELSE 0 END)::int AS passport_stamp,
              SUM(CASE WHEN event_type = 'trail_complete' THEN 1 ELSE 0 END)::int AS trail_complete,
              SUM(CASE WHEN event_type = 'drop_claim' THEN 1 ELSE 0 END)::int AS drop_claim
       FROM app_events
       WHERE created_at >= now() - interval '30 days'
       GROUP BY 1
       ORDER BY 1 ASC`,
    );

    // top referrers by referral_signup (last 30 days)
    const topReferrers = await sql(
      `SELECT entity_id AS inviter_user_id,
              COUNT(*)::int AS signups
       FROM app_events
       WHERE event_type = 'referral_signup'
         AND created_at >= now() - interval '30 days'
       GROUP BY 1
       ORDER BY signups DESC
       LIMIT 10`,
    );

    // video_events aggregations (top videos by views, likes, shares)
    const videoAgg = await sql(
      `SELECT v.id as video_id,
              v.caption,
              v.restaurant_id,
              COALESCE(SUM((ve.event_type = 'view')::int), 0)::int AS views,
              COALESCE(SUM((ve.event_type = 'like')::int), 0)::int AS likes,
              COALESCE(SUM((ve.event_type = 'share')::int), 0)::int AS shares
       FROM videos v
       LEFT JOIN video_events ve ON ve.video_id = v.id
       WHERE v.is_published = true
       GROUP BY v.id, v.caption, v.restaurant_id
       ORDER BY views DESC, likes DESC, shares DESC
       LIMIT 25`,
    );

    return Response.json(
      {
        appEventsDaily,
        topReferrers,
        videoTop: videoAgg,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("GET /api/admin/analytics error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
