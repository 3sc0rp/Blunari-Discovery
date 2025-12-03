import sql from "@/app/api/utils/sql";
import validateEnv from "@/app/api/utils/envCheck";

export async function GET() {
  // Validate env on each health check (logs warnings only)
  try {
    validateEnv();
  } catch {}

  const start = Date.now();
  let dbLatencyMs = null;
  try {
    // tiny query to verify connectivity
    await sql("SELECT 1");
    dbLatencyMs = Date.now() - start;
    return new Response(JSON.stringify({ status: "ok", dbLatencyMs }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    dbLatencyMs = Date.now() - start;
    console.error("/api/health DB check failed", err);
    return new Response(
      JSON.stringify({
        status: "error",
        dbLatencyMs,
        error: "DB connectivity failed",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
