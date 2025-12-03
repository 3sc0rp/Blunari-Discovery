import { auth } from "@/auth";
import { fromTable, insert } from "@/app/api/utils/supabase";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id?.toString() || null;

    const key = `${getClientKey(request)}:claims:post:${userId || "anon"}`;
    const rl = rateLimit({ key, limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    let { restaurant_id, country, city, slug, name, email, phone, message } =
      body || {};

    if (!restaurant_id && country && city && slug) {
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
      return Response.json(
        { error: "Missing restaurant reference" },
        { status: 400 },
      );
    }

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    await insert("restaurant_claims", {
      restaurant_id,
      user_id: userId,
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 50) : null,
      message: message ? String(message).slice(0, 5000) : null,
      status: "pending",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/blunari/claims error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
