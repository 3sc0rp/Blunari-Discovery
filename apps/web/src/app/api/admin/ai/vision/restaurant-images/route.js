import { requireAdmin } from "@/app/api/utils/admin";
import { visionAnalyze, chatJSON } from "@/app/api/utils/ai";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL;

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
    const restaurant_id = body?.restaurant_id;
    if (!restaurant_id)
      return Response.json(
        { error: "restaurant_id required" },
        { status: 400 },
      );

    const images = await sb("/rest/v1/restaurant_images", {
      params: { select: "id,path,alt", restaurant_id: `eq.${restaurant_id}` },
    });
    if (!Array.isArray(images) || images.length === 0)
      return Response.json({ ok: true, analyzed: 0 });

    const results = [];
    for (const img of images) {
      // Prefer our storage signer route which works with private buckets
      let url = img.path;
      try {
        const signer = await fetch(`${APP_URL}/api/blunari/storage/sign-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: img.path, expiresIn: 600 }),
        });
        if (signer.ok) {
          const j = await signer.json();
          if (j?.url) url = j.url;
        }
      } catch {}

      const content = await visionAnalyze({
        images: [url],
        prompt:
          "Return JSON with fields: {tags: string[], quality_score: integer 0-100}. Tags should be food/drink/dining related only.",
      });

      // If model returns plain text, try to coerce to JSON via a second pass
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        const coerced = await chatJSON({
          system:
            "Coerce the given text into valid JSON with shape {tags: string[], quality_score: integer}.",
          user: content,
        });
        parsed = coerced;
      }

      const tags = Array.isArray(parsed?.tags) ? parsed.tags : [];
      const quality = Number(parsed?.quality_score || 0);

      await sb("/rest/v1/restaurant_images_ai", {
        method: "POST",
        body: { image_id: img.id, tags, quality_score: quality },
      }).catch(async () => {
        await sb("/rest/v1/restaurant_images_ai", {
          method: "PATCH",
          params: { image_id: `eq.${img.id}` },
          body: { tags, quality_score: quality },
        });
      });

      results.push({ image_id: img.id, tags, quality_score: quality });
    }

    return Response.json({ ok: true, analyzed: results.length, results });
  } catch (err) {
    console.error("POST /api/admin/ai/vision/restaurant-images error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
