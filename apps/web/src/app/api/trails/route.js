import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/trails
// Lists published trails. If user is signed in, includes completion counts.
export async function GET(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;

    const trails = await sql(
      `SELECT 
         t.id,
         t.title,
         t.slug,
         t.description,
         t.is_published,
         t.badge_id,
         COALESCE(steps.total_steps, 0)::int AS step_count,
         COALESCE(completed.completed_steps, 0)::int AS completed_count
       FROM trails t
       LEFT JOIN (
         SELECT trail_id, COUNT(*) AS total_steps
         FROM trail_steps
         GROUP BY trail_id
       ) steps ON steps.trail_id = t.id
       LEFT JOIN (
         SELECT trail_id, COUNT(*) AS completed_steps
         FROM trail_step_completions
         WHERE ($1::text IS NOT NULL) AND user_id = $1
         GROUP BY trail_id
       ) completed ON completed.trail_id = t.id
       WHERE COALESCE(t.is_published, false) = true
       ORDER BY t.created_at DESC, t.id DESC`,
      [userId],
    );

    const headers = !userId
      ? {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "Content-Type": "application/json",
        }
      : { "Cache-Control": "no-store", "Content-Type": "application/json" };

    return new Response(JSON.stringify({ trails: trails || [] }), { headers });
  } catch (err) {
    console.error("GET /api/trails error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
