import sql from "@/app/api/utils/sql";

// NEW: Optional Supabase REST support
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  const cacheHeaders = {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    "Content-Type": "application/json",
  };

  // Try Supabase first if configured
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const url = new URL("/rest/v1/city", SUPABASE_URL);
      url.searchParams.set(
        "select",
        "country,city,name,timezone,currency,center_lat,center_lng,neighborhoods",
      );
      url.searchParams.set("order", "name");

      const res = await fetch(url.toString(), {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(
          `Supabase /city REST returned [${res.status}] ${res.statusText}`,
        );
      }
      const rows = await res.json();
      return new Response(JSON.stringify({ cities: rows || [] }), {
        headers: cacheHeaders,
      });
    } catch (err) {
      console.error("GET /api/cities Supabase error", err);
      // Fall through to DB below
    }
  }

  // Platform DB
  try {
    const rows =
      await sql`SELECT country, city, name, timezone, currency, center_lat, center_lng, neighborhoods FROM city ORDER BY name`;
    return new Response(JSON.stringify({ cities: rows || [] }), {
      headers: cacheHeaders,
    });
  } catch (err) {
    console.error("GET /api/cities error", err);
    return new Response(JSON.stringify({ cities: [] }), {
      status: 200,
      headers: cacheHeaders,
    });
  }
}
