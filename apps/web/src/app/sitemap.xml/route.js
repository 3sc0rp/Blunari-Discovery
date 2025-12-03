import sql from "@/app/api/utils/sql";

export async function GET() {
  const base = process.env.APP_URL || "";
  const now = new Date().toISOString();
  try {
    // Pull published slugs directly for sitemap
    const [restaurantRows, trailRows] = await sql.transaction((txn) => [
      txn`SELECT slug FROM restaurant WHERE published = true ORDER BY updated_at DESC LIMIT 5000`,
      txn`SELECT slug FROM trails WHERE COALESCE(is_published, false) = true ORDER BY updated_at DESC LIMIT 5000`,
    ]);

    const urls = [];

    // Core pages
    urls.push({
      loc: `${base}/`,
      changefreq: "daily",
      priority: 0.8,
      lastmod: now,
    });
    urls.push({
      loc: `${base}/restaurants`,
      changefreq: "daily",
      priority: 0.8,
      lastmod: now,
    });
    urls.push({
      loc: `${base}/trails`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: now,
    });
    // Additional key surfaces
    urls.push({
      loc: `${base}/feed`,
      changefreq: "hourly",
      priority: 0.6,
      lastmod: now,
    });
    urls.push({
      loc: `${base}/invite`,
      changefreq: "weekly",
      priority: 0.5,
      lastmod: now,
    });
    urls.push({
      loc: `${base}/drops`,
      changefreq: "daily",
      priority: 0.6,
      lastmod: now,
    });

    // Published restaurants
    for (const r of restaurantRows || []) {
      if (!r?.slug) continue;
      urls.push({
        loc: `${base}/restaurants/${encodeURIComponent(r.slug)}`,
        changefreq: "weekly",
        priority: 0.7,
        lastmod: now,
      });
    }

    // Published trails
    for (const t of trailRows || []) {
      if (!t?.slug) continue;
      urls.push({
        loc: `${base}/trails/${encodeURIComponent(t.slug)}`,
        changefreq: "weekly",
        priority: 0.6,
        lastmod: now,
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
        "Cache-Control": "public, max-age=600", // 10 minutes
      },
    });
  } catch (err) {
    console.error("Failed to build sitemap.xml", err);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc></url>\n</urlset>`;
    return new Response(fallback, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
