import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Ensure a row exists in public.users for the current session's user.
// - Uses email as the idempotent key (lowercased)
// - Preserves existing role (won't downgrade admin)
export async function ensureUserRow(session) {
  const user = session?.user || null;
  const id = user?.id ? String(user.id) : null;
  const emailRaw = user?.email || null;
  if (!id || !emailRaw) {
    return null;
  }
  const email = String(emailRaw).toLowerCase();

  // Upsert by email: create if missing, otherwise update id & updated_at only
  const rows = await sql(
    `INSERT INTO users (id, email, role)
     VALUES ($1, $2, 'user')
     ON CONFLICT (email) DO UPDATE SET
       id = EXCLUDED.id,
       updated_at = now()
     RETURNING id, email, role`,
    [id, email],
  );
  return rows?.[0] || null;
}

export async function getMe() {
  const session = await auth();
  const user = session?.user || null;
  if (!user?.email || !user?.id) {
    return { user: null };
  }
  // Ensure row exists / is in sync
  await ensureUserRow(session);
  const email = String(user.email).toLowerCase();
  const rows = await sql(
    `SELECT id, email, role FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  const me = rows?.[0] || null;
  return { user: me };
}

export async function requireAdminRole() {
  const session = await auth();
  const user = session?.user || null;
  if (!user?.email || !user?.id) {
    const res = new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
    throw res;
  }
  // ensure exists
  await ensureUserRow(session);
  const email = String(user.email).toLowerCase();
  const rows = await sql(`SELECT role FROM users WHERE email = $1 LIMIT 1`, [
    email,
  ]);
  const role = rows?.[0]?.role || null;
  if (role !== "admin") {
    const res = new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    throw res;
  }
  return user;
}
