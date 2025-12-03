import sql from "@/app/api/utils/sql";

// NEW: Optional Supabase REST support
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArrayParam(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchFromSupabase(path, params) {
  const url = new URL(path, SUPABASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Supabase REST ${path} -> [${res.status}] ${res.statusText}`,
    );
  }
  return res.json();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const q = searchParams.get("q") || "";
    const cuisines = parseArrayParam(searchParams.get("cuisine"));
    const price = searchParams.get("price") || "";
    const neighborhood = searchParams.get("neighborhood") || "";
    const tags = parseArrayParam(searchParams.get("tags"));
    const sort = searchParams.get("sort") || "score-desc";

    const cacheHeaders = {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Content-Type": "application/json",
    };

    // Supabase path (if configured)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && country && city) {
      try {
        // 1) Find city row by country/city
        const cityRows = await fetchFromSupabase("/rest/v1/city", {
          select: "id,country,city,name",
          country: `eq.${country}`,
          city: `eq.${city}`,
          limit: "1",
        });
        const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;

        if (cityRow?.id) {
          // 2) Build restaurant query
          const params = {
            select: "*",
            limit: "500",
            city_id: `eq.${cityRow.id}`,
          };
          if (q) {
            params.or = `(name.ilike.*${q}*,description.ilike.*${q}*,tagline.ilike.*${q}*)`;
          }
          if (price) params.price = `eq.${price}`;
          if (neighborhood) params.neighborhood = `eq.${neighborhood}`;
          // PostgREST array overlaps for cuisines/tags if provided
          if (cuisines.length) params.cuisines = `ov.{${cuisines.join(",")}}`;
          if (tags.length) params.tags = `ov.{${tags.join(",")}}`;

          // Map order where possible; price sort handled in JS
          if (sort === "name-asc") params.order = "name.asc";
          else if (sort === "neighborhood-asc")
            params.order = "neighborhood.asc";
          else if (sort === "score-desc") params.order = "score.desc";

          const rows = await fetchFromSupabase("/rest/v1/restaurant", params);

          // JS-side sorting for price-asc/desc and any fallbacks
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
            JSON.stringify({ city: cityRow, restaurants: sorted || [] }),
            { headers: cacheHeaders },
          );
        }
      } catch (err) {
        console.error("GET /api/restaurants Supabase error", err);
        // Fall through to platform DB/local below
      }
    }

    // Platform DB; require a valid city
    if (!country || !city) {
      return new Response(JSON.stringify({ city: null, restaurants: [] }), {
        headers: cacheHeaders,
      });
    }

    const found = await sql(
      "SELECT id, country, city, name FROM city WHERE country = $1 AND city = $2 LIMIT 1",
      [country, city],
    );
    const cityRow = found?.[0] || null;
    if (!cityRow) {
      return new Response(JSON.stringify({ city: null, restaurants: [] }), {
        headers: cacheHeaders,
      });
    }

    const whereClauses = ["r.city_id = $1"]; // param 1 is city_id
    const values = [cityRow.id];

    if (q) {
      // use ILIKE for simple matching
      whereClauses.push(
        `(r.name ILIKE $${values.length + 1} OR r.description ILIKE $${
          values.length + 1
        } OR r.tagline ILIKE $${values.length + 1})`,
      );
      values.push(`%${q}%`);
    }
    if (price) {
      whereClauses.push(`r.price = $${values.length + 1}`);
      values.push(price);
    }
    if (neighborhood) {
      whereClauses.push(`r.neighborhood = $${values.length + 1}`);
      values.push(neighborhood);
    }
    if (cuisines.length) {
      whereClauses.push(
        `EXISTS (SELECT 1 FROM unnest(r.cuisines) c WHERE c = ANY($${
          values.length + 1
        }))`,
      );
      values.push(cuisines);
    }
    if (tags.length) {
      whereClauses.push(
        `EXISTS (SELECT 1 FROM unnest(r.tags) t WHERE t = ANY($${
          values.length + 1
        }))`,
      );
      values.push(tags);
    }

    let orderBy = "r.score DESC";
    if (sort === "price-asc") orderBy = "length(coalesce(r.price,'')) ASC";
    else if (sort === "price-desc")
      orderBy = "length(coalesce(r.price,'')) DESC";
    else if (sort === "name-asc") orderBy = "r.name ASC";
    else if (sort === "neighborhood-asc") orderBy = "r.neighborhood ASC";

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";
    const query = `
        SELECT r.* FROM restaurant r
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT 500
      `;
    const rows = await sql(query, values);
    return new Response(
      JSON.stringify({ city: cityRow, restaurants: rows || [] }),
      { headers: cacheHeaders },
    );
  } catch (err) {
    console.error("GET /api/restaurants error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
