import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET(request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const trailId = Number(url.searchParams.get("trailId"));
    if (!trailId) return Response.json({ items: [] });

    const rows = await sql(
      `SELECT s.*, r.name AS restaurant_name
       FROM trail_steps s
       JOIN restaurant r ON r.id = s.restaurant_id
       WHERE s.trail_id = $1
       ORDER BY s.order_index ASC`,
      [trailId],
    );
    return Response.json({ items: rows || [] });
  } catch (err) {
    console.error("GET /api/admin/trails/steps error", err);
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
      trail_id,
      restaurant_id,
      order_index = null,
      note = null,
    } = body || {};
    if (!trail_id || !restaurant_id) {
      return Response.json(
        { error: "trail_id and restaurant_id are required" },
        { status: 400 },
      );
    }

    // If no order_index, append at the end
    let idx = order_index;
    if (idx == null) {
      const rows = await sql(
        `SELECT COALESCE(MAX(order_index), -1) + 1 AS next_idx FROM trail_steps WHERE trail_id = $1`,
        [Number(trail_id)],
      );
      idx = rows?.[0]?.next_idx ?? 0;
    }

    const inserted = await sql(
      `INSERT INTO trail_steps (trail_id, restaurant_id, order_index, note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [Number(trail_id), Number(restaurant_id), Number(idx), note],
    );

    return Response.json({ item: inserted?.[0] || null });
  } catch (err) {
    console.error("POST /api/admin/trails/steps error", err);
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
    const { id, restaurant_id, order_index, note } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const sets = [];
    const values = [];
    let i = 1;
    if (restaurant_id !== undefined) {
      sets.push(`restaurant_id = $${i++}`);
      values.push(Number(restaurant_id));
    }
    if (order_index !== undefined) {
      sets.push(`order_index = $${i++}`);
      values.push(Number(order_index));
    }
    if (note !== undefined) {
      sets.push(`note = $${i++}`);
      values.push(note);
    }
    sets.push(`updated_at = now()`);

    const query = `UPDATE trail_steps SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    values.push(Number(id));
    const rows = await sql(query, values);
    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("PATCH /api/admin/trails/steps error", err);
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

    await sql(`DELETE FROM trail_steps WHERE id = $1`, [Number(id)]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/trails/steps error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
