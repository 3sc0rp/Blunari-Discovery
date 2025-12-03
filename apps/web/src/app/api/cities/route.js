import { createServerClient } from "@/app/api/utils/supabase-server";
import sql from "@/app/api/utils/sql";

// Feature flag: Use Supabase if data is migrated
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

export async function GET() {
  const cacheHeaders = {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    "Content-Type": "application/json",
  };

  try {
    // NEW: Supabase-first approach
    if (USE_SUPABASE) {
      const supabase = createServerClient();
      const { data: rows, error } = await supabase
        .from('city')
        .select('country, city, name, timezone, currency, center_lat, center_lng, neighborhoods')
        .order('name');

      if (error) throw error;

      return new Response(JSON.stringify({ cities: rows || [] }), {
        headers: cacheHeaders,
      });
    }

    // LEGACY: Neon fallback (during migration period)
    const rows = await sql`SELECT country, city, name, timezone, currency, center_lat, center_lng, neighborhoods FROM city ORDER BY name`;
    return new Response(JSON.stringify({ cities: rows || [] }), {
      headers: cacheHeaders,
    });

  } catch (err) {
    console.error("GET /api/cities error", err);
    return new Response(JSON.stringify({ error: "Failed to load cities" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
