import { rateLimit } from "@/app/api/utils/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, { method = "GET", body } = {}) {
  const url = new URL(path, SUPABASE_URL);
  const res = await fetch(url.toString(), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase ${method} ${path} -> [${res.status}] ${res.statusText}: ${text}`,
    );
  }
  return res.json();
}

export async function POST(request) {
  try {
    await rateLimit({
      key: "events-log",
      limit: 120,
      windowMs: 60_000,
      request,
    });
    const body = await request.json();
    const event = {
      type: String(body?.type || "unknown"),
      payload: body?.payload || {},
      user_id: String(body?.user_id || ""),
      path: String(body?.path || ""),
      ts: new Date().toISOString(),
    };
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      // no-op if supabase is not configured
      return Response.json({ ok: true, skipped: true });
    }
    await sb("/rest/v1/events", { method: "POST", body: event });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/events/log error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
