import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql(
      `SELECT b.*, ub.awarded_at, ub.meta
       FROM user_badge ub
       JOIN badge b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.awarded_at DESC`,
      [userId],
    );

    return Response.json({ badges: rows || [] });
  } catch (err) {
    console.error("GET /api/gamification/badges error", err);
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
