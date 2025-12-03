import { supabaseEnabled, fromTable } from "@/app/api/utils/supabase";

function parseArrayParam(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const q = searchParams.get("q") || "";
    const cuisines = parseArrayParam(
      searchParams.get("cuisine") || searchParams.get("cuisines"),
    );
    const price = searchParams.get("price") || "";
    const neighborhood = searchParams.get("neighborhood") || "";
    const tags = parseArrayParam(searchParams.get("tags"));
    const sort = searchParams.get("sort") || "score-desc";

    const cacheHeaders = {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Content-Type": "application/json",
    };

    if (!supabaseEnabled) {
      // Defer to the platform DB endpoint (no mock fallback)
      const legacyUrl = new URL("/api/restaurants", request.url);
      if (country) legacyUrl.searchParams.set("country", country);
      if (city) legacyUrl.searchParams.set("city", city);
      if (q) legacyUrl.searchParams.set("q", q);
      if (cuisines.length)
        legacyUrl.searchParams.set("cuisine", cuisines.join(","));
      if (price) legacyUrl.searchParams.set("price", price);
      if (neighborhood)
        legacyUrl.searchParams.set("neighborhood", neighborhood);
      if (tags.length) legacyUrl.searchParams.set("tags", tags.join(","));
      if (sort) legacyUrl.searchParams.set("sort", sort);
      const res = await fetch(legacyUrl.toString());
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: cacheHeaders,
      });
    }

    // 1) resolve city id (required)
    if (!country || !city) {
      return new Response(JSON.stringify({ city: null, restaurants: [] }), {
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
      return new Response(JSON.stringify({ city: null, restaurants: [] }), {
        headers: cacheHeaders,
      });
    }

    const params = {
      select: "*",
      limit: "500",
      published: "is.true",
      city_id: `eq.${cityRow.id}`,
    };
    if (q)
      params.or = `(name.ilike.*${q}*,description.ilike.*${q}*,tagline.ilike.*${q}*)`;
    if (price) params.price = `eq.${price}`;
    if (neighborhood) params.neighborhood = `eq.${neighborhood}`;
    if (cuisines.length) params.cuisines = `ov.{${cuisines.join(",")}}`;
    if (tags.length) params.tags = `ov.{${tags.join(",")}}`;

    if (sort === "name-asc") params.order = "name.asc";
    else if (sort === "neighborhood-asc") params.order = "neighborhood.asc";
    else if (sort === "score-desc") params.order = "score.desc";

    const rows = await fromTable("restaurant", params);

    let sorted = Array.isArray(rows) ? rows : [];
    if (sort === "price-asc")
      sorted = [...sorted].sort(
        (a, b) => (a?.price || "").length - (b?.price || "").length,
      );
    else if (sort === "price-desc")
      sorted = [...sorted].sort(
        (a, b) => (b?.price || "").length - (a?.price || "").length,
      );

    return new Response(
      JSON.stringify({ city: cityRow, restaurants: sorted }),
      { headers: cacheHeaders },
    );
  } catch (err) {
    console.error("GET /api/blunari/restaurants error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
