import { requireAdmin } from "@/app/api/utils/admin";
import { sbGet, sbRequest } from "@/app/api/utils/supabase";

export async function GET(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const params = { select: "*", order: "created_at.desc" };
  if (status) params.status = `eq.${status}`;
  const rows = await sbGet("/rest/v1/catering_requests", params);
  return Response.json({ requests: rows });
}

export async function PATCH(request) {
  await requireAdmin();
  const body = await request.json();
  if (!body.id)
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
    });
  const { id, ...rest } = body;
  const out = await sbRequest("/rest/v1/catering_requests", {
    method: "PATCH",
    params: { id: `eq.${id}` },
    json: rest,
  });
  return Response.json(out);
}
