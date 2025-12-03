export const metadata = {
  title: "Deploy Readiness Guide – Blunari Discovery",
  description:
    "Verify production env, health checks, admin access, and sanity checks for Blunari Discovery.",
};

export default function DeployDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose prose-invert">
      <h1>Deploy Readiness Guide</h1>
      <p>
        Use this to verify production configuration, health checks, and admin
        access.
      </p>
      <p>
        Date: <strong>Wednesday, December 3, 2025</strong>
      </p>

      <h2>1) Environment validation</h2>
      <p>Required environment variables (server):</p>
      <ul>
        <li>APP_URL (e.g., https://yourdomain.com)</li>
        <li>DATABASE_URL (Postgres connection string)</li>
        <li>AUTH_SECRET (Auth secret)</li>
        <li>AUTH_URL (Auth public URL)</li>
        <li>SUPABASE_URL (Supabase project URL)</li>
        <li>SUPABASE_SERVICE_ROLE_KEY (Server service key)</li>
      </ul>
      <p>Optional (if enabled): STRIPE_SECRET_KEY</p>
      <p>
        Runtime check: <code>/api/health</code> triggers a small validation on
        each call and logs warnings to the server logs if any required env var
        is missing or APP_URL is misconfigured.
      </p>

      <h2>2) Health check endpoint</h2>
      <p>
        Path: <code>GET /api/health</code>
      </p>
      <pre>
        <code>{`{
  "status": "ok",
  "dbLatencyMs": 12
}`}</code>
      </pre>
      <p>Headers: Cache-Control: no-store</p>
      <h3>Sample monitor configs</h3>
      <ul>
        <li>
          <strong>UptimeRobot:</strong> HTTPS → URL:{" "}
          <code>https://YOUR_DOMAIN/api/health</code> → Interval: 5 minutes →
          Alert if status != 200 for 2 consecutive checks
        </li>
        <li>
          <strong>Pingdom:</strong> HTTP(S) → URL:{" "}
          <code>https://YOUR_DOMAIN/api/health</code> → Method: GET → Expect 200
          → 1–5 minute interval
        </li>
      </ul>

      <h2>3) Admin account</h2>
      <p>
        Ensure at least one admin exists (role = 'admin'). Promote a user via
        SQL:
      </p>
      <pre>
        <code>{`UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';`}</code>
      </pre>
      <p>
        Verify: non-admin → /admin returns 403/redirect; admin → /admin loads
        dashboard and actions work.
      </p>

      <h2>4) Production sanity checklist</h2>
      <p>After deploy, hit each of these:</p>
      <ul>
        <li>/ (home)</li>
        <li>/restaurants</li>
        <li>/trails</li>
        <li>/passport (signed in)</li>
        <li>/feed</li>
        <li>/invite</li>
        <li>/admin (as admin)</li>
      </ul>
      <p>Confirm:</p>
      <ul>
        <li>Cards/data render</li>
        <li>No obvious 500 errors (browser + server logs)</li>
        <li>/sitemap.xml and /robots.txt respond</li>
        <li>/api/health returns status ok</li>
      </ul>

      <h2>5) Smoke tests</h2>
      <p>
        Quick check: <code>GET /api/smoke</code> (anonymous → personalized
        checks are marked "skipped"). From Admin, open /admin and click "Run" in
        the Smoke Test card for a live report.
      </p>

      <h2>6) Notes</h2>
      <ul>
        <li>
          Personalized routes and write endpoints send Cache-Control: no-store
        </li>
        <li>Public routes are cached briefly with stale-while-revalidate</li>
        <li>
          Claims/likes/stamps are rate limited (watch for 429s under load)
        </li>
      </ul>
    </div>
  );
}
