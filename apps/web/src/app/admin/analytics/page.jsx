"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminAnalyticsPage() {
  const [showDetails, setShowDetails] = useState(true);
  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load analytics [${res.status}]`);
      }
      return res.json();
    },
  });

  const retryBtn = (
    <button
      onClick={() => refetch()}
      className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
      aria-label="Retry loading analytics"
    >
      Retry
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 border rounded animate-pulse bg-gray-50 h-[92px]"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="border rounded p-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="p-4 border rounded">
          <div className="text-red-600 mb-3">
            Something went wrong while loading analytics. Try again.
          </div>
          {retryBtn}
          {error?.message ? (
            <div className="text-xs text-gray-500 mt-2">
              {String(error.message)}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const { appEventsDaily = [], topReferrers = [], videoTop = [] } = data || {};
  const last = appEventsDaily[appEventsDaily.length - 1] || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Signups (today)" value={last.signup || 0} />
        <Card
          title="Passport stamps (today)"
          value={last.passport_stamp || 0}
        />
        <Card
          title="Trail completes (today)"
          value={last.trail_complete || 0}
        />
        <Card title="Drop claims (today)" value={last.drop_claim || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <section className="border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Top Referrers (last 30 days)</h2>
            <button
              className="text-sm text-gray-600 underline"
              onClick={() => setShowDetails((s) => !s)}
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide" : "Show"} details
            </button>
          </div>
          {showDetails && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Inviter User ID</th>
                    <th className="py-2 pr-4">Signups</th>
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 text-gray-500">
                        No referral signups found.
                      </td>
                    </tr>
                  ) : (
                    topReferrers.map((r) => (
                      <tr key={r.inviter_user_id} className="border-t">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {r.inviter_user_id}
                        </td>
                        <td className="py-2 pr-4">{r.signups}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top Videos */}
        <section className="border rounded p-4">
          <div className="mb-3">
            <h2 className="font-medium">Top Videos</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Video</th>
                  <th className="py-2 pr-4">Views</th>
                  <th className="py-2 pr-4">Likes</th>
                  <th className="py-2 pr-4">Shares</th>
                </tr>
              </thead>
              <tbody>
                {videoTop.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-gray-500">
                      No video activity yet.
                    </td>
                  </tr>
                ) : (
                  videoTop.map((v) => {
                    const label = v.caption
                      ? v.caption
                      : `Video #${v.video_id}`;
                    return (
                      <tr key={v.video_id} className="border-t">
                        <td className="py-2 pr-4">
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[320px]">
                              {label}
                            </span>
                            <span className="text-xs text-gray-500">
                              ID: {v.video_id}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">{v.views}</td>
                        <td className="py-2 pr-4">{v.likes}</td>
                        <td className="py-2 pr-4">{v.shares}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 border rounded">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
