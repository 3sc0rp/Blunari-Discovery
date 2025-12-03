import { embedTexts } from "@/app/api/utils/ai";
import { rateLimit } from "@/app/api/utils/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, { method = "GET", params, body } = {}) {
  const url = new URL(path, SUPABASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Supabase ${method} ${path} -> [${res.status}] ${res.statusText}: ${text}`,
    );
  }
  return res.json();
}

export async function GET(request) {
  try {
    await rateLimit({
      key: "semantic-search",
      limit: 60,
      windowMs: 60_000,
      request,
    });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const limit = Number(searchParams.get("limit") || 20);

    if (!q) return Response.json({ restaurants: [] });

    const origin = new URL(request.url).origin;
    const keywordFallback = async (reason = "fallback") => {
      const res = await fetch(
        `${origin}/api/blunari/restaurants?country=${encodeURIComponent(country || "")}&city=${encodeURIComponent(city || "")}&q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) {
        throw new Error(
          `Fallback keyword search failed: [${res.status}] ${res.statusText}`,
        );
      }
      const data = await res.json();
      return Response.json({
        restaurants: data.restaurants || [],
        city: data.city || null,
        source: reason,
      });
    };

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !country || !city) {
      // Fallback: keyword search via existing endpoint
      return await keywordFallback("fallback-env");
    }

    // 1) City lookup
    const cityRows = await sb("/rest/v1/city", {
      params: {
        select: "id,country,city,name",
        country: `eq.${country}`,
        city: `eq.${city}`,
        limit: "1",
      },
    });
    const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;

    // If city isn't in Supabase yet, gracefully fall back to keyword search
    if (!cityRow?.id) {
      console.warn("semantic-search: city not found, using keyword fallback", {
        country,
        city,
      });
      return await keywordFallback("fallback-city");
    }

    // 2) Embed query
    const [embedding] = await embedTexts([q]);

    // 3) Call RPC function for vector match
    let results = [];
    try {
      results = await sb("/rest/v1/rpc/match_restaurants", {
        method: "POST",
        body: {
          city_id: cityRow.id,
          query_embedding: embedding,
          match_count: limit,
          similarity_threshold: 1.0,
        },
      });
    } catch (e) {
      console.error(
        "RPC match_restaurants failed, falling back to keyword search",
        e,
      );
      return await keywordFallback("fallback-rpc");
    }

    // If vector search returned nothing, try keyword fallback before giving up
    if (!Array.isArray(results) || results.length === 0) {
      console.warn(
        "semantic-search: vector returned 0 results, using fallback",
        {
          q,
          country,
          city,
        },
      );
      return await keywordFallback("fallback-empty-vector");
    }

    return Response.json({
      restaurants: results || [],
      city: cityRow,
      source: "vector",
    });
  } catch (err) {
    console.error("GET /api/search/semantic error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
