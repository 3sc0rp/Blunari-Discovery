import { auth } from "@/auth";
import { insert } from "@/app/api/utils/supabase";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id?.toString() || null;

    const key = `${getClientKey(request)}:catering:post:${userId || "anon"}`;
    const rl = rateLimit({ key, limit: 12, windowMs: 60_000 });
    if (!rl.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, phone, message, details, city_id, restaurant_id } =
      body || {};

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    const safe = {
      user_id: userId,
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 50) : null,
      message: message ? String(message).slice(0, 5000) : null,
      details: details && typeof details === "object" ? details : {},
      city_id: city_id || null,
      restaurant_id: restaurant_id || null,
      status: "new",
    };

    await insert("catering_requests", safe);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/blunari/catering error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
