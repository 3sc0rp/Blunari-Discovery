import sql from "@/app/api/utils/sql";

function periodWhere(scope) {
  if (scope === "daily") return "day = CURRENT_DATE";
  if (scope === "weekly") return "day >= (CURRENT_DATE - INTERVAL '6 days')";
  return "day >= (CURRENT_DATE - INTERVAL '365 days')"; // all-time (last year)
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const scope = (url.searchParams.get("scope") || "daily").toLowerCase();
    const country = url.searchParams.get("country");
    const city = url.searchParams.get("city");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50", 10),
      200,
    );

    let cityId = null;
    if (country && city) {
      const cityRows = await sql(
        "SELECT id FROM city WHERE country = $1 AND city = $2 LIMIT 1",
        [String(country).toLowerCase(), String(city).toLowerCase()],
      );
      cityId = cityRows?.[0]?.id || null;
    }

    const whereParts = [periodWhere(scope)];
    const params = [];
    let i = 1;

    if (cityId) {
      whereParts.push(`city_id = $${i++}`);
      params.push(cityId);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await sql(
      `SELECT user_id, COUNT(*)::int AS checkins, (COUNT(*)::int * 10)::int AS points,
              MIN(day) AS first_day, MAX(day) AS last_day
       FROM checkin
       ${where}
       GROUP BY user_id
       ORDER BY points DESC, last_day DESC
       LIMIT $${i}`,
      [...params, limit],
    );

    // Attach basic profile info if available
    const results = [];
    for (const r of rows || []) {
      results.push({
        user_id: r.user_id,
        points: r.points,
        checkins: r.checkins,
        first_day: r.first_day,
        last_day: r.last_day,
      });
    }

    return Response.json({ items: results, scope, cityId });
  } catch (err) {
    console.error("GET /api/gamification/leaderboard error", err);
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
