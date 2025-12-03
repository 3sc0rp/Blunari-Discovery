import { fromTable } from "@/app/api/utils/supabase";

export async function GET(request, { params }) {
  try {
    const slug = params?.slug;
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");

    if (!slug || !country || !city) {
      return Response.json(
        { error: "Missing slug/country/city" },
        { status: 400 },
      );
    }

    // resolve city
    const cityRows = await fromTable("city", {
      select: "id,country,city,name",
      country: `eq.${country}`,
      city: `eq.${city}`,
      limit: "1",
    });
    const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;
    if (!cityRow) {
      return Response.json({ error: "City not found" }, { status: 404 });
    }

    const lists = await fromTable("curated_lists", {
      select: "*",
      city_id: `eq.${cityRow.id}`,
      slug: `eq.${slug}`,
      published: "is.true",
      limit: "1",
    });
    const list = Array.isArray(lists) ? lists[0] : null;
    if (!list) {
      return Response.json({ error: "List not found" }, { status: 404 });
    }

    // entries: join manually
    const entries = await fromTable("curated_list_entries", {
      select: "id,position,commentary,restaurant_id",
      list_id: `eq.${list.id}`,
      order: "position.asc",
      limit: "500",
    });

    // fetch restaurants for these entries
    const ids = (entries || []).map((e) => e.restaurant_id);
    let restaurants = [];
    if (ids.length) {
      // in PostgREST, use in. syntax
      restaurants = await fromTable("restaurant", {
        select: "*",
        id: `in.(${ids.join(",")})`,
        published: "is.true",
      });
    }

    return Response.json({
      city: cityRow,
      list,
      entries: entries || [],
      restaurants: restaurants || [],
    });
  } catch (err) {
    console.error("GET /api/blunari/lists/[slug] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
