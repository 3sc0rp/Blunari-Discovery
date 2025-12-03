import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Ensure profile row exists
    await sql(
      "INSERT INTO user_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
      [userId],
    );

    // Fetch profile, counts, recent stamps, and earned badges
    const [profileRows, stampCountRows, recentRows, badgeRows] =
      await sql.transaction((txn) => [
        txn("SELECT user_id, xp, level FROM user_profile WHERE user_id = $1", [
          userId,
        ]),
        txn(
          "SELECT COUNT(*)::int AS count FROM restaurant_stamps WHERE user_id = $1",
          [userId],
        ),
        txn(
          `SELECT s.first_stamped_at, r.id AS restaurant_id, r.name, c.city, c.country, r.slug
           FROM restaurant_stamps s
           JOIN restaurant r ON r.id = s.restaurant_id
           JOIN city c ON c.id = r.city_id
           WHERE s.user_id = $1
           ORDER BY s.first_stamped_at DESC
           LIMIT 20`,
          [userId],
        ),
        txn(
          `SELECT b.id, b.slug, b.name, b.description, b.icon, ub.awarded_at
           FROM user_badge ub
           JOIN badge b ON b.id = ub.badge_id
           WHERE ub.user_id = $1
           ORDER BY ub.awarded_at DESC`,
          [userId],
        ),
      ]);

    const profile = profileRows?.[0] || { xp: 0, level: 1 };
    const stampsCount = stampCountRows?.[0]?.count ?? 0;
    const recent = recentRows || [];
    const badges = badgeRows || [];

    const xp = Number(profile.xp || 0);
    const level = Number(profile.level || 1);
    const xpInLevel = xp % 100;
    const xpToNext = 100 - xpInLevel;
    const progress = Math.max(0, Math.min(100, xpInLevel));

    return new Response(
      JSON.stringify({
        profile: { xp, level, xpInLevel, xpToNext, progress },
        stamps: { total: stampsCount, recent },
        badges: { earned: badges },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/passport error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
