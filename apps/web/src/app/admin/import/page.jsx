"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminImportPage() {
  const qc = useQueryClient();
  const [selectedCityKey, setSelectedCityKey] = useState("");
  const [query, setQuery] = useState("Restaurants");
  const [limit, setLimit] = useState(150);
  const [verified, setVerified] = useState(true);
  const [embed, setEmbed] = useState(true);

  const {
    data: citiesData,
    isLoading: loadingCities,
    error: citiesError,
  } = useQuery({
    queryKey: ["admin-cities-list"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error(`cities [${res.status}] ${res.statusText}`);
      return res.json();
    },
  });

  const cities = citiesData?.cities || [];
  const cityOptions = useMemo(
    () =>
      cities.map((c) => ({
        key: `${c.country}:${c.city}`,
        label: `${c.name} (${c.city.toUpperCase()}, ${c.country.toUpperCase()})`,
        country: c.country,
        city: c.city,
      })),
    [cities],
  );

  const selected = useMemo(
    () => cityOptions.find((o) => o.key === selectedCityKey),
    [cityOptions, selectedCityKey],
  );

  const importMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/import/local-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`import failed [${res.status}] ${res.statusText} ${t}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semantic-search"] });
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    importMutation.mutate({
      country: selected.country,
      city: selected.city,
      query,
      limit: Number(limit),
      verified,
      embed,
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Import Restaurants</h1>
      <p className="text-gray-600 mb-6">
        Fetch restaurants for a city from Google Business Data and upsert into
        Supabase. Optionally generate AI embeddings for semantic search.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          {loadingCities ? (
            <div className="text-gray-500">Loading cities…</div>
          ) : citiesError ? (
            <div className="text-red-600">Failed to load cities</div>
          ) : (
            <select
              value={selectedCityKey}
              onChange={(e) => setSelectedCityKey(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select a city…</option>
              {cityOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Restaurants"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Limit</label>
            <input
              type="number"
              min={1}
              max={300}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              Verified only
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={embed}
              onChange={(e) => setEmbed(e.target.checked)}
            />
            Generate embeddings (AI search)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!selected || importMutation.isPending}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {importMutation.isPending ? "Importing…" : "Import"}
          </button>
          {importMutation.isError && (
            <div className="text-red-600 text-sm">
              {importMutation.error?.message || "Import failed"}
            </div>
          )}
        </div>
      </form>

      {importMutation.isSuccess && (
        <div className="mt-6 border rounded p-4">
          <div className="font-medium mb-1">Import complete</div>
          <div className="text-sm text-gray-600">
            Imported {importMutation.data?.imported ?? 0} restaurants
            {embed ? `, embedded ${importMutation.data?.embedded ?? 0}` : ""}.
          </div>
          {Array.isArray(importMutation.data?.restaurants) &&
          importMutation.data.restaurants.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm max-h-[280px] overflow-auto">
              {importMutation.data.restaurants.slice(0, 100).map((r) => (
                <li key={r.slug}>
                  {r.name} <span className="text-gray-500">({r.slug})</span>
                </li>
              ))}
              {importMutation.data.restaurants.length > 100 && (
                <li className="text-gray-500">
                  …and {importMutation.data.restaurants.length - 100} more
                </li>
              )}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
