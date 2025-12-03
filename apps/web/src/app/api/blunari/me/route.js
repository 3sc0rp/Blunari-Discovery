import { auth } from "@/auth";
import { ensureUserRow } from "@/app/api/utils/user"; // added ensure
import sql from "@/app/api/utils/sql"; // fetch role

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user || null;
    if (!user) return Response.json({ user: null }, { status: 200 });

    // Ensure users row exists/syncs (idempotent)
    await ensureUserRow(session);

    // fetch role from users
    const email = String(user.email || "").toLowerCase();
    let role = null;
    try {
      const rows = await sql(
        `SELECT role FROM users WHERE email = $1 LIMIT 1`,
        [email],
      );
      role = rows?.[0]?.role || null;
    } catch (_e) {
      role = null;
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
        role,
      },
    });
  } catch (err) {
    console.error("GET /api/blunari/me error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
