import { fromTable } from "@/app/api/utils/supabase";

export async function GET(request) {
  try {
    const cacheHeaders = {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Content-Type": "application/json",
    };
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");

    if (!country || !city) {
      return new Response(JSON.stringify({ lists: [] }), {
        headers: cacheHeaders,
      });
    }

    const cityRows = await fromTable("city", {
      select: "id,country,city,name",
      country: `eq.${country}`,
      city: `eq.${city}`,
      limit: "1",
    });
    const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;
    if (!cityRow) {
      return new Response(JSON.stringify({ lists: [] }), {
        headers: cacheHeaders,
      });
    }

    const lists = await fromTable("curated_lists", {
      select: "*",
      city_id: `eq.${cityRow.id}`,
      published: "is.true",
      order: "title.asc",
      limit: "200",
    });

    return new Response(
      JSON.stringify({
        city: cityRow,
        lists: Array.isArray(lists) ? lists : [],
      }),
      { headers: cacheHeaders },
    );
  } catch (err) {
    console.error("GET /api/blunari/lists error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
