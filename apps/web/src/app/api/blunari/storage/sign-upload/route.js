import { ensureBucket, createSignedUploadUrl } from "@/app/api/utils/supabase";
import { rateLimit, getClientKey } from "@/app/api/utils/rateLimit";

const BUCKET = "restaurant-images";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function randomHex(n = 8) {
  return Array.from(crypto.getRandomValues(new Uint8Array(n)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request) {
  try {
    const key = `${getClientKey(request)}:sign-upload`;
    const rl = rateLimit({ key, limit: 30, windowMs: 60_000 });
    if (!rl.ok)
      return Response.json({ error: "Too many requests" }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const { filename, contentType, size } = body || {};
    if (!filename || !contentType || typeof size !== "number") {
      return Response.json(
        { error: "filename, contentType, size required" },
        { status: 400 },
      );
    }
    if (!ALLOWED.has(contentType)) {
      return Response.json({ error: "Unsupported MIME type" }, { status: 400 });
    }
    if (size > MAX_BYTES) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    await ensureBucket(BUCKET, false);

    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const base = `${yyyy}/${mm}/${dd}`;

    const ext = (
      filename.includes(".") ? filename.split(".").pop() : ""
    ).toLowerCase();
    const name = `${randomHex(8)}${ext ? "." + ext : ""}`;
    const objectPath = `${base}/${name}`;

    const data = await createSignedUploadUrl(BUCKET, objectPath, contentType);
    return Response.json({ bucket: BUCKET, path: objectPath, ...data });
  } catch (err) {
    console.error("POST /api/blunari/storage/sign-upload error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
