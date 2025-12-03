// Simple server-side smoke test runner
// - Calls key pages and APIs from the server
// - Reports HTTP status and basic content checks
// - Uses caller cookies so authed tests (e.g., /api/passport) can run when the caller is signed in
// - Never throws; always returns a JSON report

export async function GET(request) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  try {
    const reqUrl = new URL(request.url);
    const base = `${reqUrl.protocol}//${reqUrl.host}`;
    const cookie = request.headers.get("cookie") || "";

    const results = {};
    const summary = { ok: true, passed: 0, failed: 0, skipped: 0 };

    async function hit(
      path,
      { expect = 200, contains, name, headers: extraHeaders } = {},
    ) {
      const url = path.startsWith("http") ? path : `${base}${path}`;
      let res,
        bodyText = "";
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            ...(extraHeaders || {}),
            cookie,
            Accept: "*/*",
          },
          cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("text") || ct.includes("json") || ct.includes("html")) {
          bodyText = await res.text();
        }
      } catch (e) {
        results[name || path] = { ok: false, error: String(e) };
        summary.ok = false;
        summary.failed += 1;
        return;
      }

      const statusOk =
        res.status === expect ||
        (Array.isArray(expect) && expect.includes(res.status));
      const containsOk = contains
        ? (bodyText || "").toLowerCase().includes(contains.toLowerCase())
        : true;
      const ok = statusOk && containsOk;
      results[name || path] = {
        url,
        status: res.status,
        ok,
        contains: contains || null,
      };
      if (ok) summary.passed += 1;
      else {
        summary.failed += 1;
        summary.ok = false;
      }
    }

    // Public pages (status only)
    await hit("/", { name: "home", expect: 200 });
    await hit("/restaurants", { name: "restaurants", expect: [200, 302] });
    await hit("/trails", { name: "trails", expect: 200 });
    await hit("/feed", { name: "feed", expect: 200 });

    // SEO surfaces
    await hit("/sitemap.xml", { name: "sitemap", expect: 200 });
    await hit("/robots.txt", { name: "robots", expect: 200 });

    // Public APIs (status only)
    await hit("/api/drops/today", {
      name: "drops_today",
      expect: [200, 204, 404],
    });
    await hit("/api/videos/feed", { name: "videos_feed", expect: 200 });

    // Health
    await hit("/api/health", { name: "health", expect: 200 });

    // Personalized API: /api/passport — only passes when caller is signed in
    // If not signed in, we consider 401 as "skipped"
    {
      const url = `${base}/api/passport`;
      let res;
      try {
        res = await fetch(url, { headers: { cookie }, cache: "no-store" });
      } catch (e) {
        results["passport_api"] = { ok: false, error: String(e) };
        summary.ok = false;
        summary.failed += 1;
      }
      if (res) {
        if (res.status === 200) {
          results["passport_api"] = { url, status: res.status, ok: true };
          summary.passed += 1;
        } else if (res.status === 401) {
          results["passport_api"] = {
            url,
            status: res.status,
            ok: false,
            skipped: true,
            note: "Not signed in",
          };
          summary.skipped += 1;
        } else {
          results["passport_api"] = { url, status: res.status, ok: false };
          summary.ok = false;
          summary.failed += 1;
        }
      }
    }

    return new Response(JSON.stringify({ summary, results }, null, 2), {
      headers,
    });
  } catch (err) {
    console.error("/api/smoke error", err);
    return new Response(
      JSON.stringify({
        summary: { ok: false, passed: 0, failed: 1, skipped: 0 },
        error: "Smoke test failed to run",
        detail: String(err),
      }),
      { status: 500, headers },
    );
  }
}
