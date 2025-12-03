import { requireAdmin } from "@/app/api/utils/admin";
import { rateLimit } from "@/app/api/utils/rateLimit";
import { sbGet, upsert, sbRequest } from "@/app/api/utils/supabase";
import { embedTexts } from "@/app/api/utils/ai";

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request) {
  try {
    await requireAdmin();
    await rateLimit({
      key: "admin-import-local-business",
      limit: 10,
      windowMs: 60_000,
      request,
    });

    const body = await request.json().catch(() => ({}));
    const country = (body.country || "").toLowerCase();
    const city = (body.city || "").toLowerCase();
    const query = body.query || "Restaurants";
    const limit = Math.min(Math.max(Number(body.limit || 100), 1), 300);
    const onlyVerified = body.verified !== false; // default true
    const generateEmbeddings = Boolean(body.embed);

    if (!country || !city) {
      return Response.json(
        { error: "country and city are required" },
        { status: 400 },
      );
    }

    // 1) Resolve city row (center lat/lng for bias)
    const cityRows = await sbGet("/rest/v1/city", {
      select: "id,country,city,name,center_lat,center_lng",
      country: `eq.${country}`,
      city: `eq.${city}`,
      limit: 1,
    });
    const cityRow = Array.isArray(cityRows) ? cityRows[0] : null;
    if (!cityRow?.id) {
      return Response.json(
        { error: "City not found in Supabase" },
        { status: 404 },
      );
    }

    // 2) Call integration: Google Business Data search
    const params = new URLSearchParams();
    params.set(
      "query",
      `${query} in ${cityRow.name || city}, ${country.toUpperCase()}`,
    );
    params.set("limit", String(limit));
    if (cityRow.center_lat && cityRow.center_lng) {
      params.set("lat", String(cityRow.center_lat));
      params.set("lng", String(cityRow.center_lng));
    }
    params.set("region", country);
    params.set("language", "en");
    params.set("business_status", "OPEN");
    // Prefer restaurants as subtype when available
    params.set("subtypes", "Restaurant");
    if (onlyVerified) params.set("verified", "true");

    const integrationUrl = `/integrations/local-business-data/search?${params.toString()}`;
    const integrationRes = await fetch(integrationUrl, { method: "GET" });
    if (!integrationRes.ok) {
      const text = await integrationRes.text();
      throw new Error(
        `Integration search failed: [${integrationRes.status}] ${integrationRes.statusText} ${text}`,
      );
    }
    const integrationJson = await integrationRes.json();
    const items = Array.isArray(integrationJson?.data)
      ? integrationJson.data
      : [];

    if (items.length === 0) {
      return Response.json({
        imported: 0,
        embedded: 0,
        restaurants: [],
        city: cityRow,
        note: "No businesses returned by integration",
      });
    }

    // 3) Transform to our restaurant rows
    const usedSlugs = new Set();
    const toRow = (it) => {
      const baseSlug = slugify(it.name);
      let slug = baseSlug;
      let i = 1;
      while (usedSlugs.has(slug)) {
        const suffix = (it.place_id || it.google_id || it.business_id || `${i}`)
          .toString()
          .slice(-6)
          .toLowerCase();
        slug = `${baseSlug}-${suffix}`;
        i++;
      }
      usedSlugs.add(slug);

      const subtypes = Array.isArray(it.subtypes) ? it.subtypes : [];
      const cuisines = subtypes.filter((s) =>
        /restaurant|bar|bistro|cafe|grill|pizza|sushi|taco|bbq|pub|seafood|steak/i.test(
          String(s),
        ),
      );
      const tags = subtypes;
      const score =
        typeof it.rating === "number"
          ? Math.round(Math.max(0, Math.min(5, it.rating)) * 20)
          : null;

      return {
        city_id: cityRow.id,
        slug,
        name: it.name || null,
        neighborhood: it.district || null,
        cuisines: cuisines.length ? cuisines : null,
        price: it.price_level || null,
        tags: tags.length ? tags : null,
        score,
        tagline: null,
        description: it.about?.summary || null,
        address: it.address || it.full_address || null,
        website: it.website || null,
        phone: it.phone_number || null,
        images: undefined, // images handled separately via Storage; skip here
        highlights: null,
        picks: null,
        menu: null,
        status: it.business_status === "CLOSED" ? "closed" : "open",
        lat: typeof it.latitude === "number" ? it.latitude : null,
        lng: typeof it.longitude === "number" ? it.longitude : null,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    };

    // Filter to restaurant-like places just in case
    const filtered = items.filter((it) => {
      const type = (it.type || "").toLowerCase();
      const subs = (it.subtypes || []).map((s) => String(s).toLowerCase());
      return type.includes("restaurant") || subs.includes("restaurant");
    });

    const rows = (filtered.length ? filtered : items).map(toRow);

    // 4) Upsert restaurants
    const inserted = await upsert("restaurant", rows);

    // Build a map of slug -> id by refetching the upserted rows (select by city and slugs)
    const slugsCsv = rows.map((r) => r.slug).join(",");
    let idLookup = [];
    try {
      idLookup = await sbGet("/rest/v1/restaurant", {
        select: "id,slug",
        city_id: `eq.${cityRow.id}`,
        slug: `in.(${slugsCsv})`,
      });
    } catch (e) {
      // ignore; embedding step will be skipped if we can't map ids
    }

    let embedded = 0;
    if (generateEmbeddings && Array.isArray(idLookup) && idLookup.length) {
      // Generate embeddings in small batches to avoid token limits
      const bySlug = new Map(rows.map((r) => [r.slug, r]));
      const batchSize = 20;
      for (let i = 0; i < idLookup.length; i += batchSize) {
        const slice = idLookup.slice(i, i + batchSize);
        const texts = slice.map(({ slug }) => {
          const r = bySlug.get(slug);
          const parts = [
            r?.name,
            r?.tagline,
            r?.description,
            (r?.cuisines || []).join(" "),
            (r?.tags || []).join(" "),
          ].filter(Boolean);
          return parts.join(". ");
        });
        const embeddings = await embedTexts(texts);
        const rowsEmb = slice.map((row, idx) => ({
          restaurant_id: row.id,
          embedding: embeddings[idx],
          updated_at: new Date().toISOString(),
        }));
        await sbRequest("/rest/v1/restaurant_embedding", {
          method: "POST",
          json: rowsEmb,
          extraHeaders: { Prefer: "resolution=merge-duplicates" },
        });
        embedded += rowsEmb.length;
      }
    }

    return Response.json({
      imported: Array.isArray(inserted) ? inserted.length : rows.length,
      embedded,
      city: cityRow,
      restaurants: rows.map((r) => ({ name: r.name, slug: r.slug })),
    });
  } catch (err) {
    console.error("POST /api/admin/import/local-business error", err);
    const msg = err?.message || "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
