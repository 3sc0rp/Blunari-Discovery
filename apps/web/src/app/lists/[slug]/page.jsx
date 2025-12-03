import { useMemo, useEffect, useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { normalizeCityFromPath } from "../../../data/cities";

export default function ListDetailPage({ params: { slug } }) {
  const theme = useTheme();
  const [loc, setLoc] = useState({ country: "us", city: "atlanta" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromPath = normalizeCityFromPath(window.location.pathname);
    if (fromPath) {
      setLoc(fromPath);
      return;
    }
    try {
      const raw = localStorage.getItem("blunari.city");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.country && parsed?.city) setLoc(parsed);
    } catch {}
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["list", slug, loc.country, loc.city],
    queryFn: async () => {
      const sp = new URLSearchParams({ country: loc.country, city: loc.city });
      const res = await fetch(`/api/blunari/lists/${slug}?${sp.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/lists/${slug}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const restaurantsById = useMemo(() => {
    const map = new Map();
    (data?.restaurants || []).forEach((r) => map.set(r.id, r));
    return map;
  }, [data]);

  const items = useMemo(() => {
    return (data?.entries || [])
      .map((e) => ({
        note: e.commentary,
        restaurant: restaurantsById.get(e.restaurant_id),
      }))
      .filter((x) => !!x.restaurant);
  }, [data, restaurantsById]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div>Loading…</div>
      </div>
    );
  }

  if (error || !data?.list) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div className="text-center">
          <p className="mb-4">List not found.</p>
          <a href="/lists" className={`underline ${theme.hover.text}`}>
            Back to lists
          </a>
        </div>
      </div>
    );
  }

  const list = data.list;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.description,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `/${loc.country}/${loc.city}/restaurants/${item.restaurant.slug}`,
      name: item.restaurant.name,
    })),
  };

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <header className="px-4 sm:px-6 py-4 max-w-5xl mx-auto flex items-center justify-between">
        <a
          href="/lists"
          className={`inline-flex items-center gap-2 text-sm ${theme.hover.text}`}
        >
          <ArrowLeft size={16} /> Lists
        </a>
      </header>
      <main className="px-4 sm:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">{list.title}</h1>
          <p className={`${theme.text.muted} mt-2`}>{list.description}</p>
          <ol className="mt-6 space-y-4">
            {items.map((item, idx) => (
              <li
                key={item.restaurant.slug}
                className={`rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-4 ring-1 ring-white/5`}
              >
                <div className="flex gap-4">
                  <div className="text-2xl font-bold opacity-60 w-10 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <a
                      href={`/${loc.country}/${loc.city}/restaurants/${item.restaurant.slug}`}
                      className={`font-semibold text-lg ${theme.hover.text}`}
                    >
                      {item.restaurant.name}
                    </a>
                    <p className={`text-sm ${theme.text.muted}`}>
                      {item.restaurant.neighborhood} •{" "}
                      {item.restaurant.cuisines.join(" · ")}
                    </p>
                    {item.note && <p className={`text-sm mt-2`}>{item.note}</p>}
                  </div>
                  <img
                    src={item.restaurant.images?.[0]}
                    alt=""
                    className="w-28 h-20 object-cover rounded-lg"
                    loading="lazy"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </div>
  );
}
