import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/admin";

export async function GET(request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "200", 10),
      500,
    );

    const rows = await sql(
      `SELECT v.*, r.name AS restaurant_name, r.slug AS restaurant_slug,
              u.email AS uploader_email,
              (
                SELECT COUNT(*)::int FROM video_likes vl WHERE vl.video_id = v.id
              ) AS likes,
              (
                SELECT COUNT(*)::int FROM video_events ve WHERE ve.video_id = v.id AND ve.event_type = 'view'
              ) AS views
       FROM videos v
       JOIN restaurant r ON r.id = v.restaurant_id
       LEFT JOIN users u ON u.id = v.uploader_user_id
       ORDER BY v.created_at DESC
       LIMIT $1`,
      [limit],
    );

    return Response.json(
      { items: rows || [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("GET /api/admin/videos error", err);
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
      uploader_user_id = null,
      video_url,
      caption = null,
      is_published = false,
    } = body || {};
    if (!restaurant_id || !video_url) {
      return Response.json(
        { error: "restaurant_id and video_url are required" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `INSERT INTO videos (restaurant_id, uploader_user_id, video_url, caption, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        Number(restaurant_id),
        uploader_user_id ? String(uploader_user_id) : null,
        String(video_url),
        caption,
        Boolean(is_published),
      ],
    );

    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("POST /api/admin/videos error", err);
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
    const {
      id,
      restaurant_id,
      uploader_user_id,
      video_url,
      caption,
      is_published,
    } = body || {};
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const sets = [];
    const values = [];
    let i = 1;

    if (restaurant_id !== undefined) {
      sets.push(`restaurant_id = $${i++}`);
      values.push(Number(restaurant_id));
    }
    if (uploader_user_id !== undefined) {
      sets.push(`uploader_user_id = $${i++}`);
      values.push(uploader_user_id ? String(uploader_user_id) : null);
    }
    if (video_url !== undefined) {
      sets.push(`video_url = $${i++}`);
      values.push(String(video_url));
    }
    if (caption !== undefined) {
      sets.push(`caption = $${i++}`);
      values.push(caption);
    }
    if (is_published !== undefined) {
      sets.push(`is_published = $${i++}`);
      values.push(Boolean(is_published));
    }

    sets.push(`created_at = created_at`); // no-op to ensure non-empty sets allowed

    const query = `UPDATE videos SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    values.push(Number(id));
    const rows = await sql(query, values);
    return Response.json({ item: rows?.[0] || null });
  } catch (err) {
    console.error("PATCH /api/admin/videos error", err);
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

    await sql(`DELETE FROM videos WHERE id = $1`, [Number(id)]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/videos error", err);
    const status = err?.status || 500;
    return Response.json(
      { error: err?.message || "Internal Server Error" },
      { status },
    );
  }
}
