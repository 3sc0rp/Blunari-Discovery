import { auth } from "@/auth";
import { supabaseEnabled, sbGet } from "@/app/api/utils/supabase";
import sql from "@/app/api/utils/sql"; // added: use DB role check first

export async function requireAuth() {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    const res = new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
    throw res;
  }
  return session;
}

// Prefer role-based admin from public.users; fallback to legacy admin_users allowlist
async function isAdminByUsers(emailLower) {
  try {
    const rows = await sql(`SELECT role FROM users WHERE email = $1 LIMIT 1`, [
      emailLower,
    ]);
    return rows?.[0]?.role === "admin";
  } catch (_e) {
    return false;
  }
}

export async function isAdminUser(email) {
  const emailLower = String(email || "").toLowerCase();
  // 1) Check users.role
  const byUsers = await isAdminByUsers(emailLower);
  if (byUsers) return true;
  // 2) Fallback to legacy allowlist table if Supabase keys are configured
  if (!supabaseEnabled) return false;
  try {
    const rows = await sbGet(`/rest/v1/admin_users`, {
      select: "email",
      email: `eq.${emailLower}`,
      limit: 1,
    });
    return Array.isArray(rows) && rows.length > 0;
  } catch (_e) {
    return false;
  }
}

export async function requireAdmin() {
  const session = await requireAuth();
  const email = session.user.email;
  const allowed = await isAdminUser(email);
  if (!allowed) {
    const res = new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    throw res;
  }
  return session;
}
