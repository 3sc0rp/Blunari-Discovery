import { embedTexts } from "@/app/api/utils/ai";
import { rateLimit } from "@/app/api/utils/rateLimit";

export async function POST(request) {
  try {
    await rateLimit({ key: "ai-embed", limit: 30, windowMs: 60_000, request });
    const body = await request.json();
    const texts = Array.isArray(body?.texts) ? body.texts : [];
    if (!texts.length) {
      return Response.json({ error: "texts required" }, { status: 400 });
    }
    const embeddings = await embedTexts(texts);
    return Response.json({ embeddings });
  } catch (err) {
    console.error("POST /api/ai/embed error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
