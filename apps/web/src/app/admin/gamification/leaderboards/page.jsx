"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminLeaderboardsPage() {
  const [scope, setScope] = useState("daily");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const { data: citiesData } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/cities, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const cityOptions = useMemo(() => {
    const items = Array.isArray(citiesData)
      ? citiesData
      : citiesData?.items || [];
    return items.map((c) => ({
      key: `${c.country}:${c.city}`,
      country: c.country,
      city: c.city,
      name: c.name,
    }));
  }, [citiesData]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "leaderboard", { scope, country, city }],
    queryFn: async () => {
      const url = new URL(
        "/api/gamification/leaderboard",
        window.location.origin,
      );
      url.searchParams.set("scope", scope);
      if (country) url.searchParams.set("country", country);
      if (city) url.searchParams.set("city", city);
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(
          `When fetching /api/gamification/leaderboard, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const items = useMemo(() => data?.items || [], [data]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Leaderboards</h1>
        <div className="flex items-center gap-2">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="alltime">All-time</option>
          </select>
          <select
            value={country && city ? `${country}:${city}` : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setCountry("");
                setCity("");
                return;
              }
              const [cty, c] = v.split(":");
              setCountry(cty);
              setCity(c);
            }}
            className="border px-3 py-2 rounded min-w-[220px]"
          >
            <option value="">All Cities</option>
            {cityOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.name} ({opt.country}/{opt.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded">
        <div className="p-3 border-b text-sm text-gray-600">
          Showing {items.length} {scope}{" "}
          {country && city ? `for ${country}/${city}` : "globally"}
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 w-[60px]">#</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Check-ins</th>
              <th className="px-3 py-2">Last Day</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-3 py-6" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-3 py-6 text-red-600" colSpan={5}>
                  {String(error.message || error)}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={5}>
                  No data yet
                </td>
              </tr>
            ) : (
              items.map((row, idx) => (
                <tr key={row.user_id} className="border-t">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{row.user_id}</td>
                  <td className="px-3 py-2 font-semibold">{row.points}</td>
                  <td className="px-3 py-2">{row.checkins}</td>
                  <td className="px-3 py-2">
                    {row.last_day
                      ? new Date(row.last_day).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
