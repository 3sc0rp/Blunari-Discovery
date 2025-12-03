import { auth } from "@/auth";
import { fromTable, insert, remove } from "@/app/api/utils/supabase";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

export async function GET(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id?.toString();
    if (!userId) {
      return Response.json({ favorites: [] }, { status: 401 });
    }

    const favs = await fromTable("favorite", {
      select: "restaurant_id,created_at",
      user_id: `eq.${userId}`,
      order: "created_at.desc",
      limit: "1000",
    });

    const ids = (favs || []).map((f) => f.restaurant_id);
    let restaurants = [];
    if (ids.length) {
      restaurants = await fromTable("restaurant", {
        select: "*",
        id: `in.(${ids.join(",")})`,
        published: "is.true",
      });
    }

    return Response.json({ favorites: favs || [], restaurants });
  } catch (err) {
    console.error("GET /api/blunari/favorites error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id?.toString();
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const key = `${getClientKey(request)}:fav:post:${userId}`;
    const rl = rateLimit({ key, limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    let { restaurant_id, country, city, slug } = body || {};

    if (!restaurant_id && country && city && slug) {
      // resolve restaurant id by (city, slug)
      const cityRows = await fromTable("city", {
        select: "id",
        country: `eq.${country}`,
        city: `eq.${city}`,
        limit: "1",
      });
      const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;
      if (cityRow) {
        const rows = await fromTable("restaurant", {
          select: "id",
          city_id: `eq.${cityRow.id}`,
          slug: `eq.${slug}`,
          published: "is.true",
          limit: "1",
        });
        const r = Array.isArray(rows) ? rows[0] : null;
        restaurant_id = r?.id;
      }
    }

    if (!restaurant_id) {
      return Response.json({ error: "Missing restaurant_id" }, { status: 400 });
    }

    await insert("favorite", { user_id: userId, restaurant_id });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/blunari/favorites error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id?.toString();
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const key = `${getClientKey(request)}:fav:del:${userId}`;
    const rl = rateLimit({ key, limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const rid = searchParams.get("restaurant_id");
    if (!rid) {
      return Response.json({ error: "Missing restaurant_id" }, { status: 400 });
    }

    await remove("favorite", {
      user_id: `eq.${userId}`,
      restaurant_id: `eq.${rid}`,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/blunari/favorites error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
