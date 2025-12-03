import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import { normalizeCityFromPath } from "../../data/cities";

export default function ListsIndexPage() {
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
    queryKey: ["lists", loc.country, loc.city],
    queryFn: async () => {
      const sp = new URLSearchParams({ country: loc.country, city: loc.city });
      const res = await fetch(`/api/blunari/lists?${sp.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/lists, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const lists = data?.lists || [];

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <header className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Curated Lists</h1>
        <p className={`${theme.text.muted} mt-2`}>
          {isLoading
            ? "Loading…"
            : error
              ? "Could not load lists"
              : `Collections in ${data?.city?.name ?? "your city"}`}
        </p>
      </header>
      <main className="px-4 sm:px-6 pb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((l) => (
            <a
              key={l.slug}
              href={`/lists/${l.slug}`}
              className={`rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-5 hover:${theme.bg.borderHover} ring-1 ring-white/5 transition-shadow hover:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)]`}
            >
              <h3 className="font-semibold text-lg">{l.title}</h3>
              <p className={`${theme.text.muted} text-sm mt-1`}>
                {l.description}
              </p>
              <p className={`text-xs mt-3 ${theme.text.muted}`}>
                {/* count unknown without a join; keep simple */}
              </p>
            </a>
          ))}
          {!isLoading && !error && lists.length === 0 && (
            <div className={`${theme.text.muted}`}>No lists yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
