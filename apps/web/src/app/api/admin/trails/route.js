import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET(request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const includeSteps = url.searchParams.get("includeSteps") === "true";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "200", 10),
      500,
    );

    const trails = await sql(
      `SELECT t.*, (
          SELECT COUNT(*)::int FROM trail_steps s WHERE s.trail_id = t.id
        ) AS step_count,
        b.name AS badge_name
       FROM trails t
       LEFT JOIN badge b ON b.id = t.badge_id
       ORDER BY t.updated_at DESC
       LIMIT $1`,
      [limit],
    );

    if (!includeSteps) {
      return Response.json({ items: trails || [] });
    }

    // Load steps per trail
    const ids = (trails || []).map((t) => t.id);
    if (!ids.length) return Response.json({ items: [] });

    const steps = await sql(
      `SELECT s.*, r.name AS restaurant_name
       FROM trail_steps s
       JOIN restaurant r ON r.id = s.restaurant_id
       WHERE s.trail_id = ANY($1::int[])
       ORDER BY s.trail_id, s.order_index ASC`,
      [ids],
    );

    const byTrail = new Map();
    for (const t of trails) byTrail.set(t.id, { ...t, steps: [] });
    for (const s of steps || []) {
      const group = byTrail.get(s.trail_id);
      if (group) group.steps.push(s);
    }

    return Response.json({ items: Array.from(byTrail.values()) });
  } catch (err) {
    console.error("GET /api/admin/trails error", err);
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
      title,
      slug,
      description = null,
      is_published = false,
      badge_id = null,
    } = body || {};
    if (!title || !slug) {
      return Response.json(
        { error: "title and slug are required" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `INSERT INTO trails (title, slug, description, is_published, badge_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         is_published = EXCLUDED.is_published,
         badge_id = EXCLUDED.badge_id,
         updated_at = now()
       RETURNING *`,
      [
        String(title),
        String(slug).toLowerCase(),
        description,
        Boolean(is_published),
        badge_id ? Number(badge_id) : null,
      ],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("POST /api/admin/trails error", err);
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
    const { id, slug, title, description, is_published, badge_id } = body || {};
    if (!id && !slug) {
      return Response.json(
        { error: "id or slug is required" },
        { status: 400 },
      );
    }

    const sets = [];
    const values = [];
    let i = 1;
    if (slug != null) {
      sets.push(`slug = $${i++}`);
      values.push(String(slug).toLowerCase());
    }
    if (title !== undefined) {
      sets.push(`title = $${i++}`);
      values.push(title);
    }
    if (description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(description);
    }
    if (is_published !== undefined) {
      sets.push(`is_published = $${i++}`);
      values.push(Boolean(is_published));
    }
    if (badge_id !== undefined) {
      sets.push(`badge_id = $${i++}`);
      values.push(badge_id ? Number(badge_id) : null);
    }
    sets.push(`updated_at = now()`);

    let where;
    if (id) {
      where = `id = $${i++}`;
      values.push(Number(id));
    } else {
      where = `slug = $${i++}`;
      values.push(String(slug).toLowerCase());
    }

    const query = `UPDATE trails SET ${sets.join(", ")} WHERE ${where} RETURNING *`;
    const rows = await sql(query, values);
    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("PATCH /api/admin/trails error", err);
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

    await sql("DELETE FROM trails WHERE id = $1", [Number(id)]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/trails error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
