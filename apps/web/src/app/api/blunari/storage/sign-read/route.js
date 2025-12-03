import { createSignedReadUrl } from "@/app/api/utils/supabase";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

const BUCKET = "restaurant-images";

export async function POST(request) {
  try {
    const key = `${getClientKey(request)}:sign-read`;
    const rl = rateLimit({ key, limit: 60, windowMs: 60_000 });
    if (!rl.ok)
      return Response.json({ error: "Too many requests" }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const { path, expiresIn = 300 } = body || {};
    if (!path)
      return Response.json({ error: "path required" }, { status: 400 });

    const data = await createSignedReadUrl(
      BUCKET,
      path,
      Math.min(Math.max(30, expiresIn), 60 * 60),
    );
    return Response.json({ bucket: BUCKET, path, ...data });
  } catch (err) {
    console.error("POST /api/blunari/storage/sign-read error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
