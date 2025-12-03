import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import RestaurantCard from "../../components/RestaurantCard";
import { useQuery } from "@tanstack/react-query";

function unique(list) {
  return Array.from(new Set(list)).sort();
}

export default function RestaurantsPage() {
  const theme = useTheme();

  // Search + filters state
  const [keyword, setKeyword] = useState("");
  const [citySel, setCitySel] = useState(null); // { country, city, name }
  const [tags, setTags] = useState(""); // comma-separated basic tag search

  // Load cities
  const {
    data: citiesData,
    isLoading: citiesLoading,
    error: citiesError,
  } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/cities, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const cities = Array.isArray(citiesData?.cities) ? citiesData.cities : [];

  // Initialize default city from localStorage or first city
  useEffect(() => {
    if (!citySel && cities.length) {
      try {
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("blunari.city")
            : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          const found = cities.find(
            (c) => c.country === parsed?.country && c.city === parsed?.city,
          );
          if (found) {
            setCitySel({
              country: found.country,
              city: found.city,
              name: found.name,
            });
            return;
          }
        }
      } catch {}
      // fallback to first
      const first = cities[0];
      setCitySel({
        country: first.country,
        city: first.city,
        name: first.name,
      });
    }
  }, [cities, citySel]);

  // Persist chosen city
  useEffect(() => {
    if (citySel && typeof window !== "undefined") {
      try {
        localStorage.setItem("blunari.city", JSON.stringify(citySel));
      } catch {}
    }
  }, [citySel]);

  // Build query string for restaurants
  const tagParam = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(",");

  const {
    data: rData,
    isLoading: rLoading,
    error: rError,
    refetch,
  } = useQuery({
    queryKey: [
      "restaurants",
      citySel?.country,
      citySel?.city,
      keyword,
      tagParam,
    ],
    enabled: !!citySel,
    queryFn: async () => {
      const url = new URL(
        "/api/blunari/restaurants",
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost",
      );
      url.searchParams.set("country", citySel.country);
      url.searchParams.set("city", citySel.city);
      if (keyword) url.searchParams.set("q", keyword);
      if (tagParam) url.searchParams.set("tags", tagParam);
      const res = await fetch(url.toString().replace(/^https?:\/\/[^/]+/, ""));
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/restaurants, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const restaurants = Array.isArray(rData?.restaurants)
    ? rData.restaurants
    : [];

  const onClear = () => {
    setKeyword("");
    setTags("");
  };

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      {/* Filters header */}
      <div className="px-4 sm:px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            {/* City selector */}
            <div>
              <label className={`text-xs ${theme.text.muted}`}>City</label>
              <select
                value={citySel ? `${citySel.country}:${citySel.city}` : ""}
                onChange={(e) => {
                  const [country, city] = e.target.value.split(":");
                  const found = cities.find(
                    (c) => c.country === country && c.city === city,
                  );
                  if (found)
                    setCitySel({
                      country: found.country,
                      city: found.city,
                      name: found.name,
                    });
                }}
                className={`mt-1 px-3 py-2 rounded-md border ${theme.bg.border} bg-transparent`}
              >
                <option value="" disabled>
                  {citiesLoading ? "Loading cities…" : "Select a city"}
                </option>
                {cities.map((c) => (
                  <option
                    key={`${c.country}:${c.city}`}
                    value={`${c.country}:${c.city}`}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword */}
            <div className="flex-1">
              <label className={`text-xs ${theme.text.muted}`}>Search</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by name or description"
                className={`mt-1 w-full px-3 py-2 rounded-md border ${theme.bg.border} bg-transparent`}
              />
            </div>

            {/* Tags */}
            <div className="md:w-[300px]">
              <label className={`text-xs ${theme.text.muted}`}>
                Tags (comma separated)
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="outdoor,seaview,date-night"
                className={`mt-1 w-full px-3 py-2 rounded-md border ${theme.bg.border} bg-transparent`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className={`mt-6 px-4 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
                aria-label="Apply filters"
              >
                Apply
              </button>
              <button
                onClick={onClear}
                className={`mt-6 px-3 py-2 text-sm underline`}
                aria-label="Clear filters"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {citiesError ? (
            <p className={`${theme.text.muted}`}>Could not load cities.</p>
          ) : null}

          {/* Loading skeletons */}
          {rLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-64 rounded-2xl ${theme.bg.overlay} animate-pulse`}
                />
              ))}
            </div>
          ) : rError ? (
            <div
              className={`rounded-xl ${theme.bg.overlay} border ${theme.bg.border} p-6`}
            >
              <p className="font-semibold">Something went wrong</p>
              <p className={`${theme.text.muted}`}>
                Something went wrong while loading this. Try again.
              </p>
              <button
                onClick={() => refetch()}
                className={`mt-4 px-4 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
              >
                Retry
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <p className={`${theme.text.muted}`}>
              No restaurants found. Try adjusting your filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map((r) => (
                <RestaurantCard
                  key={r.id || r.slug}
                  restaurant={r}
                  country={citySel?.country}
                  city={citySel?.city}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
