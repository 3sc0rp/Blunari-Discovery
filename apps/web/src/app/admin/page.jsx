import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export default function AdminHome() {
  const {
    data: stats,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard", {
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok)
        throw new Error(`dashboard failed [${res.status}] ${res.statusText}`);
      return res.json();
    },
  });

  // --- Smoke test state ---
  const [smokeLoading, setSmokeLoading] = useState(false);
  const [smokeError, setSmokeError] = useState(null);
  const [smokeReport, setSmokeReport] = useState(null);
  // NEW: view tuning state
  const [showDetails, setShowDetails] = useState(false); // collapsed by default
  const [showRaw, setShowRaw] = useState(false);

  const runSmoke = async () => {
    setSmokeLoading(true);
    setSmokeError(null);
    setSmokeReport(null);
    try {
      const res = await fetch("/api/smoke", {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Smoke failed [${res.status}] ${res.statusText}`);
      }
      setSmokeReport(data);
      setShowDetails(false); // reset to collapsed on new run
      setShowRaw(false);
    } catch (e) {
      console.error("Run smoke error", e);
      setSmokeError(e?.message || "Failed to run smoke test");
    } finally {
      setSmokeLoading(false);
    }
  };

  // Derive entries for nice list view
  const smokeEntries = useMemo(() => {
    if (!smokeReport?.results) return [];
    return Object.entries(smokeReport.results).map(([k, v]) => ({
      key: k,
      ...v,
    }));
  }, [smokeReport]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-4">
          <div className="text-sm opacity-80">Total Users</div>
          <div className="text-2xl font-semibold mt-1">
            {isLoading ? "…" : (stats?.totalUsers ?? 0)}
          </div>
        </Card>
        {/* DAU */}
        <Card className="p-4">
          <div className="text-sm opacity-80">DAU (24h)</div>
          <div className="text-2xl font-semibold mt-1">
            {isLoading ? "…" : (stats?.dau ?? 0)}
          </div>
        </Card>
        {/* Drop claims */}
        <Card className="p-4">
          <div className="text-sm opacity-80">Drop Claims (24h)</div>
          <div className="text-2xl font-semibold mt-1">
            {isLoading ? "…" : (stats?.dropClaims24h ?? 0)}
          </div>
        </Card>
        {/* Trail completions */}
        <Card className="p-4">
          <div className="text-sm opacity-80">Trail Completions (24h)</div>
          <div className="text-2xl font-semibold mt-1">
            {isLoading ? "…" : (stats?.trailCompletions24h ?? 0)}
          </div>
        </Card>
      </div>

      {error ? (
        <div className="text-red-600">Failed to load dashboard</div>
      ) : null}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card as="a" className="p-4 hover:bg-white/5" href="/admin/restaurants">
          <div className="font-semibold">Restaurants</div>
          <div className="text-sm opacity-80">Create and edit restaurants</div>
        </Card>
        <Card as="a" className="p-4 hover:bg-white/5" href="/admin/drops">
          <div className="font-semibold">Daily Drops</div>
          <div className="text-sm opacity-80">Schedule and publish drops</div>
        </Card>
        <Card as="a" className="p-4 hover:bg-white/5" href="/admin/trails">
          <div className="font-semibold">Trails</div>
          <div className="text-sm opacity-80">Curate multi-step challenges</div>
        </Card>
        <Card as="a" className="p-4 hover:bg-white/5" href="/admin/badges">
          <div className="font-semibold">Badges</div>
          <div className="text-sm opacity-80">Manage badges</div>
        </Card>
        <Card as="a" className="p-4 hover:bg-white/5" href="/admin/videos">
          <div className="font-semibold">Videos</div>
          <div className="text-sm opacity-80">Review and publish videos</div>
        </Card>
        <Card as="a" className="p-4 hover:bg-white/5" href="/docs/testing">
          <div className="font-semibold">Testing Guide</div>
          <div className="text-sm opacity-80">Manual QA checklist</div>
        </Card>
      </div>

      {/* Smoke test runner */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Smoke Test</div>
            <div className="text-sm opacity-80">
              Runs quick checks against key pages/APIs
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle details */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDetails((s) => !s)}
              aria-label="Toggle details"
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide details" : "Show details"}
            </Button>
            <Button
              onClick={runSmoke}
              size="sm"
              disabled={smokeLoading}
              aria-label="Run smoke test"
            >
              {smokeLoading ? "Running…" : "Run"}
            </Button>
          </div>
        </div>
        {smokeError ? (
          <div className="mt-3 text-sm text-red-600">{smokeError}</div>
        ) : null}
        {smokeReport ? (
          <div className="mt-4 space-y-3">
            {/* Summary with color badges */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="success">
                Passed: {smokeReport?.summary?.passed ?? 0}
              </Badge>
              <Badge tone="danger">
                Failed: {smokeReport?.summary?.failed ?? 0}
              </Badge>
              <Badge tone="warning">
                Skipped: {smokeReport?.summary?.skipped ?? 0}
              </Badge>
            </div>

            {/* Collapsible details list */}
            {showDetails ? (
              <div className="space-y-2" aria-live="polite">
                {smokeEntries.length === 0 ? (
                  <div className="text-sm opacity-80">No details</div>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {smokeEntries.map((item) => {
                      const tone = item.skipped
                        ? "warning"
                        : item.ok
                          ? "success"
                          : "danger";
                      const label = item.skipped
                        ? "Skipped"
                        : item.ok
                          ? "OK"
                          : "Fail";
                      return (
                        <div
                          key={item.key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge tone={tone}>{label}</Badge>
                              <span className="font-mono text-sm break-all">
                                {item.key}
                              </span>
                            </div>
                            <div className="text-xs opacity-80 mt-1 break-all">
                              Status: {item.status ?? "-"}
                              {item.contains ? (
                                <>
                                  {" · expects contains: "}
                                  <span className="italic">
                                    {item.contains}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-xs truncate">
                            {item.url ? (
                              <a
                                className="underline"
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${item.key} in new tab`}
                              >
                                {item.url}
                              </a>
                            ) : (
                              <span className="opacity-60">(no url)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Raw JSON (collapsible) */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-1"
                onClick={() => setShowRaw((v) => !v)}
                aria-label="Toggle raw report"
                aria-expanded={showRaw}
              >
                {showRaw ? "Hide raw report" : "Show raw report"}
              </Button>
              {showRaw ? (
                <div
                  className="mt-2 max-h-64 overflow-auto rounded border bg-gray-50 dark:bg-[#0b0b0b] p-2 text-xs"
                  role="region"
                  aria-label="Raw smoke report"
                >
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(smokeReport, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
