export async function GET() {
  const base = process.env.APP_URL || "";
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /api",
    "Allow: /invite",
    `Sitemap: ${base}/sitemap.xml`,
  ].join("\n");

  return new Response(lines, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
