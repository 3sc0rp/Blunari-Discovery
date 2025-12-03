import { useMemo, useEffect, useState } from "react";
import { motion } from "motion/react";
import TopListsCarousel from "../components/TopListsCarousel";
import RestaurantCard from "../components/RestaurantCard";
import { useTheme } from "../hooks/useTheme";
// Removed mock imports
// import { restaurants } from "../data/restaurants";
// import { lists } from "../data/lists";
// Added for Today's Drop
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useUser from "../utils/useUser";
// NEW: icons for trust bar
import { ShieldCheck, Sparkles, Users } from "lucide-react";

// Page SEO (dynamic): mention today's drop if present
export async function generateMetadata() {
  const base = process.env.APP_URL || "";
  const title = "Discover Restaurants & Trails";
  const description =
    "Discover the best restaurants, complete curated trails, earn Passport XP, and catch today’s Drop on Blunari Discovery.";
  try {
    const res = await fetch(`${base}/api/drops/today`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const drop = data?.drop;
      if (drop) {
        const ogTitle = `Today’s Drop: ${drop.title} – Blunari Discovery`;
        const ogDescription = drop.description
          ? `${drop.description} • ${drop.restaurant?.name || "Restaurant"}`
          : `Claim today’s drop at ${drop.restaurant?.name || "a featured restaurant"}.`;
        return {
          title: ogTitle,
          description: ogDescription,
          openGraph: {
            title: ogTitle,
            description: ogDescription,
            url: base || "/",
          },
          twitter: {
            card: "summary_large_image",
            title: ogTitle,
            description: ogDescription,
          },
        };
      }
    }
  } catch {}
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: base || "/",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function HomePage() {
  const theme = useTheme();
  const { data: user } = useUser();
  const qc = useQueryClient();

  // Location resolution (no mock data): prefer stored selection, else first city from API
  const citiesQuery = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error("Failed to load cities");
      return res.json();
    },
    staleTime: 60_000,
  });

  const [loc, setLoc] = useState(null);
  useEffect(() => {
    if (!citiesQuery.data?.cities) return;
    let chosen = null;
    try {
      const raw = localStorage.getItem("blunari.city");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.country && parsed?.city) chosen = parsed;
    } catch {}
    if (!chosen) {
      const first = citiesQuery.data.cities[0];
      if (first) chosen = { country: first.country, city: first.city };
    }
    if (chosen) setLoc(chosen);
  }, [citiesQuery.data]);

  // Fetch trending restaurants for hero and grid
  const trendingQuery = useQuery({
    queryKey: ["home-trending", loc?.country, loc?.city],
    enabled: !!loc,
    queryFn: async () => {
      const sp = new URLSearchParams({
        country: loc.country,
        city: loc.city,
        sort: "score-desc",
      });
      const res = await fetch(`/api/blunari/restaurants?${sp.toString()}`);
      if (!res.ok)
        throw new Error(`restaurants failed [${res.status}] ${res.statusText}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const topListsQuery = useQuery({
    queryKey: ["home-lists", loc?.country, loc?.city],
    enabled: !!loc,
    queryFn: async () => {
      const sp = new URLSearchParams({ country: loc.country, city: loc.city });
      const res = await fetch(`/api/blunari/lists?${sp.toString()}`);
      if (!res.ok)
        throw new Error(`lists failed [${res.status}] ${res.statusText}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const trendingRestaurants = (trendingQuery.data?.restaurants || [])
    .filter((r) => r.published !== false)
    .slice(0, 6);

  const categories = [
    { label: "Brunch", qp: "Brunch" },
    { label: "Sushi", qp: "Sushi" },
    { label: "Steak", qp: "Steak" },
    { label: "Coffee", qp: "Coffee" },
    { label: "Dessert", qp: "Dessert" },
    { label: "Late Night", qp: "Late Night" },
    { label: "Vegan", qp: "Vegan" },
    { label: "Halal", qp: "Halal" },
  ];

  // Fetch today's drop
  const todayQuery = useQuery({
    queryKey: ["today-drop"],
    queryFn: async () => {
      const res = await fetch("/api/drops/today", {
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to load today's drop [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    staleTime: 0,
  });

  const claimMutation = useMutation({
    mutationFn: async (dropId) => {
      const res = await fetch("/api/drops/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Claim failed [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Claimed today's drop");
      if (typeof data?.xp === "number") {
        toast.success("+10 XP", {
          description: data?.justLeveledUp ? "Level up!" : undefined,
        });
      }
      qc.invalidateQueries({ queryKey: ["today-drop"] });
    },
    onError: (err) => {
      const msg = String(err?.message || "");
      if (msg.includes("sold_out")) {
        toast.error("Sold out", { description: "All slots are taken" });
      } else if (msg.includes("not active") || msg.includes("not available")) {
        toast.error("Not available", {
          description: "This drop is not active",
        });
      } else {
        toast.error("Could not claim drop");
      }
    },
  });

  // Countdown helper for the drop
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!todayQuery?.data?.drop?.ends_at) return;
    const endsAt = new Date(todayQuery.data.drop.ends_at).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, endsAt - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [todayQuery?.data?.drop?.ends_at]);

  const drop = todayQuery?.data?.drop || null;
  const claimDisabled =
    !drop ||
    todayQuery.isLoading ||
    claimMutation.isLoading ||
    drop.slots_remaining <= 0 ||
    drop.claimed_by_me;

  const handleClaim = () => {
    if (!user) {
      // Redirect to sign in, then back to home
      if (typeof window !== "undefined") {
        window.location.href = "/account/signin?callbackUrl=/";
      }
      return;
    }
    if (drop?.id) claimMutation.mutate(drop.id);
  };

  // NEW: derive progress percent if capacity is provided by API
  const capacity = drop?.capacity;
  const remaining = drop?.slots_remaining ?? 0;
  const claimed =
    typeof capacity === "number" ? Math.max(0, capacity - remaining) : null;
  const progressPct =
    typeof capacity === "number" && capacity > 0
      ? Math.min(100, Math.max(0, Math.round((claimed / capacity) * 100)))
      : null;

  // NEW: recently viewed rail (localStorage powered)
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("blunari.recentlyViewed");
      const list = JSON.parse(raw || "[]");
      if (Array.isArray(list)) setRecent(list);
    } catch {}
  }, []);

  return (
    <main
      id="main-content"
      className={`min-h-screen w-full font-inter ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      {/* Decorative background glows (updated to match brand blues) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* cyan/blue glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0EA5FF]/25 blur-3xl" />
        {/* deep indigo glow */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#2563EB]/20 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-10 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Discover Atlanta’s best places to eat.
              </span>
            </h1>
            <p className={`mt-4 text-base sm:text-lg ${theme.text.secondary}`}>
              Curated by Blunari. Built for locals and food lovers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/restaurants"
                className={`px-5 py-3 rounded-lg font-medium ${theme.bg.accent} ${theme.bg.accentText} shadow-sm ${theme.brand.ring} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                Explore all restaurants
              </a>
              <a
                href="/lists"
                className={`px-5 py-3 rounded-lg font-medium border ${theme.bg.border} ${theme.hover.bg} ring-1 ring-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                View Top Lists
              </a>
            </div>

            {/* NEW: trust bar to build credibility */}
            <div
              className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
              aria-label="Highlights"
            >
              <div
                className={`flex items-center gap-2 text-sm rounded-lg border ${theme.bg.border} ${theme.bg.overlay} px-3 py-2`}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Editor curated</span>
              </div>
              <div
                className={`flex items-center gap-2 text-sm rounded-lg border ${theme.bg.border} ${theme.bg.overlay} px-3 py-2`}
              >
                <Users size={16} aria-hidden="true" />
                <span>10k+ locals</span>
              </div>
              <div
                className={`flex items-center gap-2 text-sm rounded-lg border ${theme.bg.border} ${theme.bg.overlay} px-3 py-2`}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>Daily drops</span>
              </div>
            </div>
          </motion.div>
          <div className="relative">
            <div className="grid grid-cols-3 gap-3">
              {trendingQuery.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-28 sm:h-32 md:h-36 rounded-xl bg-white/10 animate-pulse"
                  />
                ))}
              {!trendingQuery.isLoading &&
                trendingRestaurants.map((r, i) => (
                  <motion.img
                    key={r.slug || r.id}
                    src={r.images?.[0]}
                    alt={`${r.name} preview`}
                    className="w-full h-28 sm:h-32 md:h-36 object-cover rounded-xl"
                    loading="lazy"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Drop */}
      <section id="todays-drop" className="px-4 sm:px-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">Today’s Drop</h2>
            <a
              href="/drops/my-claims"
              className={`text-sm ${theme.text.muted} ${theme.hover.text}`}
            >
              My claims
            </a>
          </div>

          {todayQuery.isLoading ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4 animate-pulse`}
            >
              <div className="h-5 w-40 bg-white/10 rounded mb-3" />
              <div className="h-4 w-64 bg-white/10 rounded mb-2" />
              <div className="h-4 w-48 bg-white/10 rounded mb-4" />
              <div className="h-8 w-28 bg-white/10 rounded" />
            </div>
          ) : !drop ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4`}
            >
              <p className={theme.text.secondary}>
                No active drop right now. Check back tomorrow!
              </p>
            </div>
          ) : (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4 sm:p-5 flex flex-col gap-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/restaurants/${drop.restaurant.slug}`}
                      className={`font-semibold ${theme.hover.text} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm`}
                    >
                      {drop.restaurant.name}
                    </a>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${theme.bg.border}`}
                    >
                      {Math.max(0, drop.slots_remaining)} slots left
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${theme.bg.border}`}
                    >
                      Ends in {countdown}
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-semibold">{drop.title}</div>
                  {drop.description ? (
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>
                      {drop.description}
                    </p>
                  ) : null}
                </div>
                <div>
                  <button
                    onClick={handleClaim}
                    disabled={claimDisabled}
                    aria-label="Claim today’s drop"
                    className={`px-4 py-2 rounded-lg font-medium ${theme.bg.accent} ${theme.bg.accentText} shadow-sm ${theme.brand.ring} disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                  >
                    {drop.claimed_by_me
                      ? "Claimed"
                      : claimMutation.isLoading
                        ? "Claiming…"
                        : "Claim"}
                  </button>
                </div>
              </div>

              {/* Progress bar (if capacity known) */}
              {typeof progressPct === "number" ? (
                <div className="w-full">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={theme.text.muted}>Claimed</span>
                    <span className={theme.text.muted}>{progressPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0EA5FF] to-[#2563EB]"
                      style={{ width: `${progressPct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Recently viewed (if any) */}
      {recent && recent.length > 0 ? (
        <section className="px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">Recently viewed</h2>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("blunari.recentlyViewed");
                    setRecent([]);
                  } catch {}
                }}
                className={`text-sm underline ${theme.text.muted}`}
                aria-label="Clear recently viewed"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {recent.map((item) => {
                const href = `/${item.country}/${item.city}/restaurants/${item.slug}`;
                return (
                  <a
                    key={item.slug}
                    href={href}
                    className={`min-w-[180px] w-[180px] rounded-xl overflow-hidden ${theme.bg.overlay} border ${theme.bg.border} ring-1 ring-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                    aria-label={`View ${item.name}`}
                  >
                    <div className="aspect-[4/3] w-full">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={`${item.name} preview`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          sizes="180px"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className={`text-xs truncate ${theme.text.muted}`}>
                        {item.city?.toUpperCase?.() || ""}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Top Lists */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl font-bold">Top Lists</h2>
            <a
              href="/lists"
              className={`text-sm ${theme.text.muted} ${theme.hover.text}`}
            >
              View all
            </a>
          </div>
          {topListsQuery.isLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`min-w-[260px] h-28 rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} animate-pulse`}
                />
              ))}
            </div>
          ) : (
            <TopListsCarousel lists={topListsQuery.data?.lists || []} />
          )}
        </div>
      </section>

      {/* Trending grid */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Trending Now{loc?.city ? ` in ${loc.city.replace(/-/g, " ")}` : ""}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trendingQuery.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xl ${theme.bg.overlay} border ${theme.bg.border} h-64 animate-pulse`}
                />
              ))}
            {!trendingQuery.isLoading &&
              trendingRestaurants.map((r) => (
                <RestaurantCard key={r.slug || r.id} restaurant={r} />
              ))}
          </div>
        </div>
      </section>

      {/* Explore by Category */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Explore by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <a
                key={c.qp}
                href={`/restaurants?cuisine=${encodeURIComponent(c.qp)}`}
                className={`text-sm px-3 py-2 rounded-full border ${theme.bg.border} ${theme.bg.overlay} ${theme.hover.bg} ring-1 ring-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
