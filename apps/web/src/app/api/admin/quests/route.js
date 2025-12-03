import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

function safeJson(input) {
  if (input == null || input === "") return null;
  if (typeof input === "object") return input;
  try {
    return JSON.parse(String(input));
  } catch (_e) {
    return null;
  }
}

export async function GET(request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "100", 10),
      500,
    );

    let rows;
    if (search) {
      rows = await sql(
        "SELECT * FROM quest WHERE name ILIKE $1 OR slug ILIKE $1 ORDER BY updated_at DESC LIMIT $2",
        ["%" + search + "%", limit],
      );
    } else {
      rows = await sql(
        "SELECT * FROM quest ORDER BY updated_at DESC LIMIT $1",
        [limit],
      );
    }
    return Response.json({ items: rows || [] });
  } catch (err) {
    console.error("GET /api/admin/quests error", err);
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
      slug,
      name,
      description = null,
      active = true,
      kind,
      target = 1,
      rules = null,
    } = body || {};

    if (!slug || !name || !kind) {
      return Response.json(
        { error: "slug, name and kind are required" },
        { status: 400 },
      );
    }

    const rulesJson = safeJson(rules);

    const rows = await sql(
      `INSERT INTO quest (slug, name, description, active, kind, target, rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         active = EXCLUDED.active,
         kind = EXCLUDED.kind,
         target = EXCLUDED.target,
         rules = EXCLUDED.rules,
         updated_at = now()
       RETURNING *`,
      [
        String(slug).toLowerCase(),
        String(name),
        description,
        Boolean(active),
        String(kind),
        Number(target),
        rulesJson,
      ],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("POST /api/admin/quests error", err);
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
    const { id, slug, name, description, active, kind, target, rules } =
      body || {};

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
    if (name != null) {
      sets.push(`name = $${i++}`);
      values.push(String(name));
    }
    if (description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(description);
    }
    if (active !== undefined) {
      sets.push(`active = $${i++}`);
      values.push(Boolean(active));
    }
    if (kind !== undefined) {
      sets.push(`kind = $${i++}`);
      values.push(String(kind));
    }
    if (target !== undefined) {
      sets.push(`target = $${i++}`);
      values.push(Number(target));
    }
    if (rules !== undefined) {
      sets.push(`rules = $${i++}`);
      values.push(safeJson(rules));
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

    const query = `UPDATE quest SET ${sets.join(", ")} WHERE ${where} RETURNING *`;
    const rows = await sql(query, values);
    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("PATCH /api/admin/quests error", err);
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

    await sql("DELETE FROM quest WHERE id = $1", [Number(id)]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/quests error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
