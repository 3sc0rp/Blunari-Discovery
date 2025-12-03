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
    await requireAdmin(request);
    const body = await request.json();
    const id = body?.id;
    const targetLocales = Array.isArray(body?.targetLocales)
      ? body.targetLocales
      : [];
    if (!id || !targetLocales.length) {
      return Response.json(
        { error: "id and targetLocales[] required" },
        { status: 400 },
      );
    }

    const rows = await sb("/rest/v1/restaurant", {
      params: {
        select: "id,name,tagline,description",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const r = rows?.[0];
    if (!r) return Response.json({ error: "not found" }, { status: 404 });

    const results = {};
    for (const locale of targetLocales) {
      const output = await chatJSON({
        system: `Translate to ${locale}. Keep brand names. Return JSON { tagline: string, description: string }`,
        user: `Name: ${r.name}\nTagline: ${r.tagline || ""}\nDescription: ${r.description || ""}`,
      });
      results[locale] = output;
      await sb("/rest/v1/restaurant_i18n", {
        method: "POST",
        body: {
          restaurant_id: id,
          locale,
          tagline: output.tagline || null,
          description: output.description || null,
          published: true,
        },
      }).catch(async () => {
        await sb("/rest/v1/restaurant_i18n", {
          method: "PATCH",
          params: { restaurant_id: `eq.${id}`, locale: `eq.${locale}` },
          body: {
            tagline: output.tagline || null,
            description: output.description || null,
            published: true,
          },
        });
      });
    }

    return Response.json({ ok: true, results });
  } catch (err) {
    console.error("POST /api/admin/ai/translate error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
