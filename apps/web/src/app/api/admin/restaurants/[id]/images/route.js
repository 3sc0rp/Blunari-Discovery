import { requireAdmin } from "@/app/api/utils/admin";
import { sbRequest, sbGet } from "@/app/api/utils/supabase";

export async function GET(request, { params: { id } }) {
  await requireAdmin();
  const rows = await sbGet("/rest/v1/restaurant_images", {
    select: "*",
    restaurant_id: `eq.${id}`,
    order: "sort_order.asc",
  });
  return Response.json({ images: rows });
}

export async function POST(request, { params: { id } }) {
  await requireAdmin();
  const body = await request.json();
  const payload = {
    restaurant_id: Number(id),
    path: body.path,
    width: body.width ?? null,
    height: body.height ?? null,
    mime: body.mime ?? null,
    alt: body.alt || null,
    sort_order: body.sort_order ?? 0,
    published: body.published ?? true,
  };
  const out = await sbRequest("/rest/v1/restaurant_images", {
    method: "POST",
    json: payload,
  });
  return Response.json(out);
}

export async function PATCH(request, { params: { id } }) {
  await requireAdmin();
  const body = await request.json();
  if (!body.image_id)
    return new Response(JSON.stringify({ error: "image_id required" }), {
      status: 400,
    });
  const { image_id, ...rest } = body;
  const out = await sbRequest("/rest/v1/restaurant_images", {
    method: "PATCH",
    params: { id: `eq.${image_id}`, restaurant_id: `eq.${id}` },
    json: rest,
  });
  return Response.json(out);
}

export async function DELETE(request, { params: { id } }) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const image_id = searchParams.get("image_id");
  if (!image_id)
    return new Response(JSON.stringify({ error: "image_id required" }), {
      status: 400,
    });
  await sbRequest("/rest/v1/restaurant_images", {
    method: "DELETE",
    params: { id: `eq.${image_id}`, restaurant_id: `eq.${id}` },
  });
  return Response.json({ ok: true });
}
