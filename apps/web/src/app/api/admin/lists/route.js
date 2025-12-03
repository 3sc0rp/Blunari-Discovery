import { requireAdmin } from "@/app/api/utils/admin";
import { sbGet, sbRequest } from "@/app/api/utils/supabase";

export async function GET(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const city_id = searchParams.get("city_id");
  const params = { select: "*", order: "updated_at.desc" };
  if (city_id) params.city_id = `eq.${city_id}`;
  const rows = await sbGet("/rest/v1/curated_lists", params);
  return Response.json({ lists: rows });
}

export async function POST(request) {
  await requireAdmin();
  const body = await request.json();
  const payload = {
    city_id: body.city_id,
    slug: body.slug,
    title: body.title,
    description: body.description || null,
    cover_image_path: body.cover_image_path || null,
    published: body.published ?? false,
  };
  const out = await sbRequest("/rest/v1/curated_lists", {
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
  const out = await sbRequest("/rest/v1/curated_lists", {
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
  await sbRequest("/rest/v1/curated_lists", {
    method: "DELETE",
    params: { id: `eq.${id}` },
  });
  return Response.json({ ok: true });
}
