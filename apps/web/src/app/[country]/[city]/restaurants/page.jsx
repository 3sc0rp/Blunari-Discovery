import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../../../hooks/useTheme";
import RestaurantCard from "../../../../components/RestaurantCard";
import FiltersBar from "../../../../components/FiltersBar";
import { useQuery } from "@tanstack/react-query";

function unique(list) {
  return Array.from(new Set(list)).sort();
}

export default function CityRestaurantsPage(props) {
  const { country, city } = props.params || {};
  const theme = useTheme();

  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState({
    cuisines: [],
    price: "",
    neighborhood: "",
    tags: [],
  });
  const [sortBy, setSortBy] = useState("score-desc");

  // load from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q") || "";
    const cuisines = (sp.get("cuisine") || "").split(",").filter(Boolean);
    const price = sp.get("price") || "";
    const neighborhood = sp.get("neighborhood") || "";
    const tags = (sp.get("tags") || "").split(",").filter(Boolean);
    const sort = sp.get("sort") || "score-desc";
    setKeyword(q);
    setSelected({ cuisines, price, neighborhood, tags });
    setSortBy(sort);
  }, [country, city]);

  // sync to URL (keep city path)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (keyword) sp.set("q", keyword);
    if (selected.cuisines.length)
      sp.set("cuisine", selected.cuisines.join(","));
    if (selected.price) sp.set("price", selected.price);
    if (selected.neighborhood) sp.set("neighborhood", selected.neighborhood);
    if (selected.tags.length) sp.set("tags", selected.tags.join(","));
    if (sortBy && sortBy !== "score-desc") sp.set("sort", sortBy);
    const qs = sp.toString();
    const url = qs
      ? `/${country}/${city}/restaurants?${qs}`
      : `/${country}/${city}/restaurants`;
    window.history.replaceState(null, "", url);
  }, [country, city, keyword, selected, sortBy]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "restaurants",
      country,
      city,
      keyword,
      selected.cuisines.join(","),
      selected.price,
      selected.neighborhood,
      selected.tags.join(","),
      sortBy,
    ],
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("country", country);
      sp.set("city", city);
      if (keyword) sp.set("q", keyword);
      if (selected.cuisines.length)
        sp.set("cuisine", selected.cuisines.join(","));
      if (selected.price) sp.set("price", selected.price);
      if (selected.neighborhood) sp.set("neighborhood", selected.neighborhood);
      if (selected.tags.length) sp.set("tags", selected.tags.join(","));
      if (sortBy) sp.set("sort", sortBy);
      // UPDATED: use Supabase-backed endpoint
      const res = await fetch(`/api/blunari/restaurants?${sp.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/restaurants, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const items = data?.restaurants || [];
  const cityLabel = useMemo(() => {
    return data?.city?.name || `${city.toUpperCase()}`;
  }, [data, city]);

  const allCuisines = useMemo(
    () => unique(items.flatMap((r) => r.cuisines || [])),
    [items],
  );
  const allNeighborhoods = useMemo(
    () => unique(items.map((r) => r.neighborhood).filter(Boolean)),
    [items],
  );
  const allTags = useMemo(
    () => unique(items.flatMap((r) => r.tags || [])),
    [items],
  );

  const onClear = () => {
    setKeyword("");
    setSelected({ cuisines: [], price: "", neighborhood: "", tags: [] });
  };

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <FiltersBar
        keyword={keyword}
        setKeyword={setKeyword}
        selected={selected}
        setSelected={setSelected}
        all={{
          cuisines: allCuisines,
          neighborhoods: allNeighborhoods,
          tags: allTags,
        }}
        onClear={onClear}
      />

      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className={`${theme.text.muted}`} aria-live="polite">
              {isLoading
                ? "Loading restaurants…"
                : error
                  ? "Could not load restaurants"
                  : `Showing ${items.length} restaurants in ${cityLabel}`}
            </p>
            {/* Sort */}
            <div className="inline-flex items-center gap-2 text-sm">
              <label htmlFor="sort" className={`${theme.text.muted}`}>
                Sort
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`bg-transparent border ${theme.bg.border} rounded-md px-2 py-1 ${theme.text.primary}`}
              >
                <option value="score-desc">Blunari Score</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="neighborhood-asc">Neighborhood (A–Z)</option>
                <option value="price-asc">Price (low→high)</option>
                <option value="price-desc">Price (high→low)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className={`mb-4 text-sm ${theme.text.muted}`}>
              There was a problem loading restaurants. Please try again.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((r) => (
              <RestaurantCard
                key={r.slug}
                restaurant={r}
                country={country}
                city={city}
              />
            ))}
          </div>
          {!isLoading && items.length === 0 && !error && (
            <div className={`mt-16 text-center ${theme.text.muted}`}>
              No restaurants match your filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
