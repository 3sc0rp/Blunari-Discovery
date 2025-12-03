import { requireAdmin } from "@/app/api/utils/admin";

export async function GET() {
  try {
    await requireAdmin();
    return new Response(JSON.stringify({ ok: true, message: "admin pong" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof Response) {
      return err; // already a Response from requireAdmin
    }
    console.error("GET /api/admin/ping error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
