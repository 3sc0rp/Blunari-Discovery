import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET() {
  try {
    await requireAdmin();

    const [usersCountRows, dauRows, dropClaimsRows, trailCompletionsRows] =
      await sql.transaction((txn) => [
        txn`SELECT COUNT(*)::int AS count FROM users`,
        txn`SELECT COUNT(DISTINCT user_id)::int AS count FROM analytics_event WHERE ts >= now() - interval '24 hours' AND user_id IS NOT NULL`,
        txn`SELECT COUNT(*)::int AS count FROM daily_drop_claims WHERE claimed_at >= now() - interval '24 hours'`,
        txn`SELECT COUNT(*)::int AS count FROM trail_completions WHERE completed_at >= now() - interval '24 hours'`,
      ]);

    const totalUsers = usersCountRows?.[0]?.count || 0;
    const dau = dauRows?.[0]?.count || 0;
    const dropClaims24h = dropClaimsRows?.[0]?.count || 0;
    const trailCompletions24h = trailCompletionsRows?.[0]?.count || 0;

    return Response.json(
      { totalUsers, dau, dropClaims24h, trailCompletions24h },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("GET /api/admin/dashboard error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
