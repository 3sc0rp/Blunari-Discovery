import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : null;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure a profile row exists
    const inserted = await sql(
      "INSERT INTO user_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *",
      [userId],
    );

    let profile = inserted?.[0] || null;
    if (!profile) {
      const rows = await sql("SELECT * FROM user_profile WHERE user_id = $1", [
        userId,
      ]);
      profile = rows?.[0] || null;
    }

    return Response.json({ profile });
  } catch (err) {
    console.error("GET /api/gamification/profile error", err);
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
