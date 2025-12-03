import { requireAdmin } from "@/app/api/utils/admin";
import { sbGet, sbRequest } from "@/app/api/utils/supabase";

export async function GET(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const city_id = searchParams.get("city_id");
  const q = searchParams.get("q");
  const params = { select: "*", order: "updated_at.desc" };
  if (city_id) params.city_id = `eq.${city_id}`;
  if (q) params.name = `ilike.%${q}%`;
  const rows = await sbGet("/rest/v1/restaurant", params);
  return Response.json({ restaurants: rows });
}

export async function POST(request) {
  await requireAdmin();
  const body = await request.json();
  const payload = {
    city_id: body.city_id,
    slug: body.slug,
    name: body.name,
    neighborhood: body.neighborhood || null,
    cuisines: body.cuisines || [],
    price: body.price || null,
    tags: body.tags || [],
    score: body.score ?? null,
    tagline: body.tagline || null,
    description: body.description || null,
    address: body.address || null,
    website: body.website || null,
    phone: body.phone || null,
    highlights: body.highlights || [],
    picks: body.picks || [],
    menu: body.menu || [],
    status: body.status || "open",
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    published: body.published ?? false,
  };
  const out = await sbRequest("/rest/v1/restaurant", {
    method: "POST",
    json: payload,
  });
  return Response.json(out);
}

export async function PATCH(request) {
  await requireAdmin();
  const body = await request.json();
  if (!body.id)
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
    });
  const { id, ...rest } = body;
  const out = await sbRequest("/rest/v1/restaurant", {
    method: "PATCH",
    params: { id: `eq.${id}` },
    json: rest,
  });
  return Response.json(out);
}

export async function DELETE(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
    });
  await sbRequest("/rest/v1/restaurant", {
    method: "DELETE",
    params: { id: `eq.${id}` },
  });
  return Response.json({ ok: true });
}
