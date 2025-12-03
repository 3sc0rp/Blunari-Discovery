export async function GET(request, { params }) {
  const base = process.env.APP_URL || "";
  const country = params?.country;
  const city = params?.city;
  const url = new URL(request.url);
  const origin = base || `${url.protocol}//${url.host}`;
  const now = new Date().toISOString();

  async function safeFetch(path) {
    const res = await fetch(`${origin}${path}`);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${path}: [${res.status}] ${res.statusText}`,
      );
    }
    return res.json();
  }

  try {
    // Fetch published restaurants and lists for the city via our API layer
    const [restaurantsRes, listsRes] = await Promise.all([
      safeFetch(
        `/api/blunari/restaurants?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`,
      ),
      safeFetch(
        `/api/blunari/lists?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`,
      ),
    ]);

    const restaurants = Array.isArray(restaurantsRes?.items)
      ? restaurantsRes.items
      : Array.isArray(restaurantsRes)
        ? restaurantsRes
        : [];
    const lists = Array.isArray(listsRes?.items)
      ? listsRes.items
      : Array.isArray(listsRes)
        ? listsRes
        : [];

    const urls = [];

    // City base pages
    urls.push({
      loc: `${origin}/${country}/${city}`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.6,
    });
    urls.push({
      loc: `${origin}/${country}/${city}/restaurants`,
      lastmod: now,
      changefreq: "hourly",
      priority: 0.8,
    });
    urls.push({
      loc: `${origin}/lists?country=${country}&city=${city}`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.6,
    });

    // Restaurant detail pages
    for (const r of restaurants) {
      if (!r?.slug) continue;
      urls.push({
        loc: `${origin}/${country}/${city}/restaurants/${encodeURIComponent(r.slug)}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // Curated list pages
    for (const l of lists) {
      if (!l?.slug) continue;
      urls.push({
        loc: `${origin}/lists/${encodeURIComponent(l.slug)}?country=${country}&city=${city}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.5,
      });
    }

    const xmlUrls = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    console.error("Failed to build city sitemap", { country, city, err });
    const fallback = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>${origin}/${country}/${city}</loc></url>\n</urlset>`;
    return new Response(fallback, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
