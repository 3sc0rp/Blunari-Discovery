import { requireAdmin } from "@/app/api/utils/admin";
import { sbGet, sbRequest } from "@/app/api/utils/supabase";

export async function GET() {
  await requireAdmin();
  const rows = await sbGet("/rest/v1/city", { select: "*", order: "name.asc" });
  return Response.json({ cities: rows });
}

export async function POST(request) {
  await requireAdmin();
  const body = await request.json();
  const payload = {
    country: body.country,
    city: body.city,
    name: body.name,
    timezone: body.timezone || null,
    currency: body.currency || null,
    center_lat: body.center_lat ?? null,
    center_lng: body.center_lng ?? null,
    neighborhoods: Array.isArray(body.neighborhoods) ? body.neighborhoods : [],
  };
  const out = await sbRequest("/rest/v1/city", {
    method: "POST",
    json: payload,
  });
  return Response.json(out);
}

export async function PATCH(request) {
  await requireAdmin();
  const body = await request.json();
  if (!body.id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
    });
  }
  const { id, ...rest } = body;
  const out = await sbRequest("/rest/v1/city", {
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
  await sbRequest("/rest/v1/city", {
    method: "DELETE",
    params: { id: `eq.${id}` },
  });
  return Response.json({ ok: true });
}
