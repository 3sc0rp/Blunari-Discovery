import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/trails/[slug]
// Returns published trail details with ordered steps and per-user completion flags.
export async function GET(request, { params }) {
  try {
    const { slug } = params || {};
    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;

    const rows = await sql(
      `SELECT id, title, slug, description, is_published, badge_id
       FROM trails
       WHERE slug = $1 AND COALESCE(is_published, false) = true
       LIMIT 1`,
      [String(slug).toLowerCase()],
    );

    const trail = rows?.[0];
    if (!trail) {
      return new Response(JSON.stringify({ error: "Trail not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    const steps = await sql(
      `WITH user_completed AS (
         SELECT step_id
         FROM trail_step_completions
         WHERE ($2::text IS NOT NULL) AND user_id = $2 AND trail_id = $1
       )
       SELECT 
         s.id AS step_id,
         s.order_index,
         s.note,
         r.id AS restaurant_id,
         r.slug AS restaurant_slug,
         r.name AS restaurant_name,
         c.country,
         c.city,
         COALESCE((uc.step_id IS NOT NULL), false) AS completed
       FROM trail_steps s
       JOIN restaurant r ON r.id = s.restaurant_id
       JOIN city c ON c.id = r.city_id
       LEFT JOIN user_completed uc ON uc.step_id = s.id
       WHERE s.trail_id = $1
       ORDER BY s.order_index ASC, s.id ASC`,
      [trail.id, userId],
    );

    const total = steps?.length || 0;
    const completed = (steps || []).filter((s) => s.completed).length;

    const headers = !userId
      ? {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "Content-Type": "application/json",
        }
      : { "Cache-Control": "no-store", "Content-Type": "application/json" };

    return new Response(
      JSON.stringify({
        trail,
        steps: steps || [],
        progress: { total, completed },
      }),
      { headers },
    );
  } catch (err) {
    console.error("GET /api/trails/[slug] error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
