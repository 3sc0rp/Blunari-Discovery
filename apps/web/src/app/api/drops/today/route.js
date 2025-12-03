import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const rows = await sql(
      `SELECT d.id,
              d.title,
              d.description,
              d.starts_at,
              d.ends_at,
              d.capacity,
              d.is_published,
              r.id AS restaurant_id,
              r.name AS restaurant_name,
              r.slug AS restaurant_slug,
              (SELECT COUNT(*)::int FROM daily_drop_claims c WHERE c.drop_id = d.id) AS slots_used,
              EXISTS(
                SELECT 1 FROM daily_drop_claims c2 WHERE c2.drop_id = d.id AND c2.user_id = $1
              ) AS claimed_by_me
       FROM daily_drops d
       JOIN restaurant r ON r.id = d.restaurant_id
       WHERE d.is_published = true
         AND d.starts_at <= now()
         AND now() < d.ends_at
       ORDER BY d.starts_at DESC
       LIMIT 1`,
      [userId],
    );

    const drop = rows?.[0];
    if (!drop) {
      return new Response(JSON.stringify({ drop: null }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    const slotsRemaining = Math.max(
      0,
      (drop.capacity || 0) - (drop.slots_used || 0),
    );

    return new Response(
      JSON.stringify({
        drop: {
          id: drop.id,
          title: drop.title,
          description: drop.description,
          starts_at: drop.starts_at,
          ends_at: drop.ends_at,
          capacity: drop.capacity,
          slots_used: drop.slots_used,
          slots_remaining: slotsRemaining,
          claimed_by_me: !!drop.claimed_by_me,
          restaurant: {
            id: drop.restaurant_id,
            name: drop.restaurant_name,
            slug: drop.restaurant_slug,
          },
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("/api/drops/today GET error", err);
    return new Response(
      JSON.stringify({ error: "Failed to load today's drop" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
