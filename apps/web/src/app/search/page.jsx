"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RestaurantCard from "@/components/RestaurantCard";
// NEW: Icons + city data for a richer UI
import {
  Search as SearchIcon,
  Sparkles,
  MapPin,
  Globe,
  Loader2,
} from "lucide-react";

export default function SemanticSearchPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("us");
  const [city, setCity] = useState("atlanta");
  const [mounted, setMounted] = useState(false);

  // Load cities from API
  const { data: citiesData } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error("Failed to load cities");
      return res.json();
    },
    staleTime: 60_000,
  });
  const cities = citiesData?.cities || [];

  // NEW: simple city dropdown
  const [cityOpen, setCityOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("q") || "");
    setCountry(sp.get("country") || "us");
    setCity(sp.get("city") || "atlanta");
    setMounted(true);
  }, []);

  const queryKey = useMemo(
    () => ["semantic-search", { q, country, city }],
    [q, country, city],
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!q.trim()) return { restaurants: [] };
      const u = new URL("/api/search/semantic", window.location.origin);
      u.searchParams.set("q", q);
      u.searchParams.set("country", country);
      u.searchParams.set("city", city);
      const res = await fetch(u.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(
          `When fetching semantic search, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: mounted && !!q.trim(),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    u.searchParams.set("q", q);
    u.searchParams.set("country", country);
    u.searchParams.set("city", city);
    window.history.pushState(
      {},
      "",
      u.pathname + "?" + u.searchParams.toString(),
    );
    refetch();
  };

  const restaurants = data?.restaurants || [];
  const source = data?.source || (q ? "ai" : "");

  // Suggested prompts for quick starts
  const suggestions = [
    "romantic italian with outdoor seating",
    "cozy date night wine bar",
    "best sushi omakase",
    "kid‑friendly brunch spots",
    "late night tacos open now",
  ];

  const filteredCities = useMemo(() => {
    const f = cityFilter.toLowerCase();
    return cities.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(f) ||
        `${c.city}, ${c.country}`.includes(f),
    );
  }, [cityFilter, cities]);

  const currentCityLabel = useMemo(() => {
    const m = cities.find((c) => c.city === city && c.country === country);
    return m ? m.name : `${city}, ${country.toUpperCase()}`;
  }, [city, country, cities]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] via-[#0B1220] to-[#0B1220] text-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-4">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/5 border border-white/10">
            <Sparkles size={14} className="text-[#7DD3FC]" />
            <span className="text-xs text-white/80">AI Semantic Search</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Find places by vibe, not keywords
          </h1>
          <p className="mt-2 text-white/60 text-sm md:text-base">
            Ask naturally. We’ll match the feeling — then apply your filters.
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={onSubmit}
          className="w-full"
          role="search"
          aria-label="AI search form"
        >
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1">
              <div className="group flex items-center gap-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 focus-within:ring-2 ring-[#38BDF8]/30 transition-shadow">
                <SearchIcon
                  size={18}
                  className="text-white/50"
                  aria-hidden="true"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find romantic Italian places with outdoor seating"
                  className="bg-transparent outline-none w-full text-base placeholder:text-white/40"
                  id="ai-search-input"
                />
                {isFetching ? (
                  <Loader2
                    className="animate-spin text-white/60"
                    size={16}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {/* Suggestions */}
              {!q && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQ(s)}
                      className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
                      aria-label={`Use suggestion: ${s}`}
                    >
                      <Sparkles
                        size={12}
                        className="inline mr-1 text-[#93C5FD]"
                      />{" "}
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country & City pills */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <Globe size={14} className="text-white/60" />
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toLowerCase())}
                  className="w-[90px] bg-transparent outline-none text-sm"
                  aria-label="Country code"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCityOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 w-[160px] justify-between"
                  aria-expanded={cityOpen}
                  aria-controls="city-popover"
                >
                  <span className="truncate text-sm">
                    {currentCityLabel.split(",")[0]}
                  </span>
                  <MapPin size={14} className="text-white/60" />
                </button>
                {cityOpen ? (
                  <div
                    id="city-popover"
                    className="absolute z-10 mt-2 w-[280px] max-h-[50vh] overflow-auto rounded-xl bg-[#0F1629] border border-white/10 p-2 shadow-2xl"
                  >
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
                      <SearchIcon size={14} className="text-white/50" />
                      <input
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        placeholder="Search cities"
                        className="bg-transparent outline-none w-full text-sm"
                        autoFocus
                      />
                    </div>
                    <ul className="mt-2 divide-y divide-white/5">
                      {filteredCities.map((c) => (
                        <li key={`${c.country}-${c.city}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setCountry(c.country);
                              setCity(c.city);
                              setCityOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-lg"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                      {filteredCities.length === 0 && (
                        <li className="px-3 py-2 text-sm text-white/60">
                          No matches
                        </li>
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              className="h-[46px] md:h-[48px] px-5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition shadow"
            >
              Search
            </button>
          </div>
        </form>

        {/* Source badge */}
        {q ? (
          <div className="mt-3 text-xs text-white/60">
            Powered by{" "}
            <span className="text-white">
              {source === "vector" ? "AI vectors" : "smart search"}
            </span>
          </div>
        ) : null}
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        {isLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            aria-live="polite"
          >
            {/* skeletons */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-4 animate-[fadeIn_300ms_ease-out]"
              >
                <div className="h-40 w-full rounded-lg shimmer mb-3" />
                <div className="h-4 w-[70%] shimmer mb-2" />
                <div className="h-4 w-[45%] shimmer" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-300 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
            Something went wrong. Please try again.
          </div>
        )}

        {!isLoading && restaurants.length === 0 && q && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center animate-[fadeIn_300ms_ease-out]">
            <Sparkles className="mx-auto text-white/50" />
            <h2 className="mt-2 text-lg font-semibold">No matches found</h2>
            <p className="text-white/60 text-sm">
              Try a nearby neighborhood, a price point, or a different vibe.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQ(s)}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {restaurants.map((r, idx) => (
            <div
              key={r.id || r.slug}
              className="animate-[fadeInUp_400ms_ease-out_forwards] opacity-0"
              style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            >
              <RestaurantCard restaurant={r} country={country} city={city} />
            </div>
          ))}
        </div>
      </section>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .shimmer { position: relative; overflow: hidden; background: linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.14) 37%, rgba(255,255,255,0.08) 63%); background-size: 400% 100%; animation: shimmerMove 1.2s ease-in-out infinite; border-radius: 0.5rem; }
        @keyframes shimmerMove { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
      `}</style>
    </div>
  );
}
