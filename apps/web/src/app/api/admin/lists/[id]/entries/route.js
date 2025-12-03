import { requireAdmin } from "@/app/api/utils/admin";
import { sbGet, sbRequest } from "@/app/api/utils/supabase";

export async function GET(request, { params: { id } }) {
  await requireAdmin();
  const rows = await sbGet("/rest/v1/curated_list_entries", {
    select: "*",
    list_id: `eq.${id}`,
    order: "position.asc",
  });
  return Response.json({ entries: rows });
}

export async function POST(request, { params: { id } }) {
  await requireAdmin();
  const body = await request.json();
  const payload = {
    list_id: Number(id),
    restaurant_id: body.restaurant_id,
    position: body.position ?? 1,
    commentary: body.commentary || null,
  };
  const out = await sbRequest("/rest/v1/curated_list_entries", {
    method: "POST",
    json: payload,
  });
  return Response.json(out);
}

export async function PATCH(request, { params: { id } }) {
  await requireAdmin();
  const body = await request.json();
  if (!body.entry_id)
    return new Response(JSON.stringify({ error: "entry_id required" }), {
      status: 400,
    });
  const { entry_id, ...rest } = body;
  const out = await sbRequest("/rest/v1/curated_list_entries", {
    method: "PATCH",
    params: { id: `eq.${entry_id}`, list_id: `eq.${id}` },
    json: rest,
  });
  return Response.json(out);
}

export async function DELETE(request, { params: { id } }) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const entry_id = searchParams.get("entry_id");
  if (!entry_id)
    return new Response(JSON.stringify({ error: "entry_id required" }), {
      status: 400,
    });
  await sbRequest("/rest/v1/curated_list_entries", {
    method: "DELETE",
    params: { id: `eq.${entry_id}`, list_id: `eq.${id}` },
  });
  return Response.json({ ok: true });
}
