import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
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

  try {
    const rows = await sql(
      `SELECT c.id,
              c.claimed_at,
              d.id AS drop_id,
              d.title,
              d.description,
              d.starts_at,
              d.ends_at,
              r.id AS restaurant_id,
              r.name AS restaurant_name,
              r.slug AS restaurant_slug
       FROM daily_drop_claims c
       JOIN daily_drops d ON d.id = c.drop_id
       JOIN restaurant r ON r.id = d.restaurant_id
       WHERE c.user_id = $1
       ORDER BY c.claimed_at DESC NULLS LAST, c.id DESC
       LIMIT 200`,
      [userId],
    );

    return new Response(JSON.stringify({ claims: rows || [] }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("/api/drops/my-claims GET error", err);
    return new Response(JSON.stringify({ error: "Failed to load claims" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
