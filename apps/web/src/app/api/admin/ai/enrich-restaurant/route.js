import { requireAdmin } from "@/app/api/utils/admin";
import { chatJSON } from "@/app/api/utils/ai";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, { method = "GET", params, body } = {}) {
  const url = new URL(path, SUPABASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
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
    const session = await requireAdmin(request);
    const body = await request.json();
    const id = body?.id;
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    // 1) Load restaurant + minimal context
    const rows = await sb("/rest/v1/restaurant", {
      params: {
        select: "id,name,tagline,description,menu,highlights,tags,cuisines",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const r = rows?.[0];
    if (!r) return Response.json({ error: "not found" }, { status: 404 });

    const userPrompt = `Analyze this restaurant's details and return JSON with fields: {\n  cuisines: string[],\n  tags: string[],\n  highlights: string[],\n  improved_tagline?: string,\n  improved_description?: string\n}\n\nName: ${r.name}\nTagline: ${r.tagline || ""}\nDescription: ${r.description || ""}\nMenu JSON: ${JSON.stringify(r.menu || [])}`;

    const out = await chatJSON({
      system:
        "You are a culinary data expert. Keep output concise and accurate JSON.",
      user: userPrompt,
    });

    const patch = {};
    if (Array.isArray(out.cuisines)) patch.cuisines = out.cuisines;
    if (Array.isArray(out.tags)) patch.tags = out.tags;
    if (Array.isArray(out.highlights)) patch.highlights = out.highlights;
    if (out.improved_tagline) patch.tagline = out.improved_tagline;
    if (out.improved_description) patch.description = out.improved_description;

    if (Object.keys(patch).length) {
      await sb("/rest/v1/restaurant", {
        method: "PATCH",
        params: { id: `eq.${id}` },
        body: patch,
      });
    }

    return Response.json({ ok: true, patch });
  } catch (err) {
    console.error("POST /api/admin/ai/enrich-restaurant error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
