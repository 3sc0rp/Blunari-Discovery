import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET(request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope"); // upcoming | past | active | all
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "200", 10),
      500,
    );

    let where = " WHERE 1=1 ";
    const values = [];
    let i = 1;

    const nowExpr = "now()";
    if (scope === "upcoming") {
      where += ` AND starts_at > ${nowExpr} `;
    } else if (scope === "past") {
      where += ` AND ends_at <= ${nowExpr} `;
    } else if (scope === "active") {
      where += ` AND starts_at <= ${nowExpr} AND ends_at > ${nowExpr} `;
    }

    const query = `
      SELECT d.*, r.name AS restaurant_name, r.slug AS restaurant_slug,
             (
               SELECT COUNT(*) FROM daily_drop_claims c WHERE c.drop_id = d.id
             )::int AS slots_used
      FROM daily_drops d
      JOIN restaurant r ON r.id = d.restaurant_id
      ${where}
      ORDER BY d.starts_at DESC
      LIMIT $${i++}
    `;
    values.push(limit);

    const rows = await sql(query, values);
    return Response.json(
      { items: rows || [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("GET /api/admin/drops error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const {
      restaurant_id,
      title,
      description = null,
      starts_at,
      ends_at,
      capacity = 0,
      is_published = false,
    } = body || {};

    if (!restaurant_id || !title || !starts_at || !ends_at) {
      return Response.json(
        { error: "restaurant_id, title, starts_at, ends_at are required" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `INSERT INTO daily_drops (restaurant_id, title, description, starts_at, ends_at, capacity, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        Number(restaurant_id),
        String(title),
        description,
        new Date(starts_at),
        new Date(ends_at),
        Number(capacity),
        Boolean(is_published),
      ],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("POST /api/admin/drops error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const { id, ...rest } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const sets = [];
    const values = [];
    let i = 1;
    const allowed = [
      "restaurant_id",
      "title",
      "description",
      "starts_at",
      "ends_at",
      "capacity",
      "is_published",
    ];
    for (const key of allowed) {
      if (rest[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        if (key === "starts_at" || key === "ends_at")
          values.push(new Date(rest[key]));
        else if (key === "capacity") values.push(Number(rest[key]));
        else if (key === "is_published") values.push(Boolean(rest[key]));
        else if (key === "restaurant_id") values.push(Number(rest[key]));
        else values.push(rest[key]);
      }
    }
    sets.push(`updated_at = now()`);

    const query = `UPDATE daily_drops SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    values.push(Number(id));
    const rows = await sql(query, values);
    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("PATCH /api/admin/drops error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const { id } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    await sql("DELETE FROM daily_drops WHERE id = $1", [Number(id)]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/drops error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
