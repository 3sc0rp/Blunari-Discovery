import { useEffect, useMemo } from "react";
import { useTheme } from "../../../../../hooks/useTheme";
import {
  MapPin,
  Phone,
  ExternalLink,
  ArrowLeft,
  Heart,
  Share2,
  CheckCircle2,
} from "lucide-react"; // added Share2, CheckCircle2 for parity
import { motion } from "motion/react";
import useFavorites from "../../../../../utils/useFavorites";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner"; // NEW: share feedback

export default function CityRestaurantDetailPage({
  params: { country, city, slug },
}) {
  const theme = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const queryClient = useQueryClient();
  const [checkedIn, setCheckedIn] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["restaurant", country, city, slug],
    queryFn: async () => {
      const sp = new URLSearchParams({ country, city });
      const res = await fetch(
        `/api/blunari/restaurants/${slug}?${sp.toString()}`,
      );
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/restaurants/${slug}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const r = data?.restaurant || null;
  const fav = r ? isFavorite(r.slug) : false;

  const images = (data?.images || []).map(
    (img) => img.signedUrl || img.url || img.path || img,
  ); // defensive

  // NEW: add to recently viewed (parity with non city-scoped page)
  useEffect(() => {
    if (!r) return;
    if (typeof window === "undefined") return;
    try {
      const key = "blunari.recentlyViewed";
      const raw = localStorage.getItem(key);
      const list = Array.isArray(JSON.parse(raw || "[]"))
        ? JSON.parse(raw || "[]")
        : [];
      const entry = {
        slug: r.slug,
        name: r.name,
        image: images?.[0] || null,
        country,
        city,
        ts: Date.now(),
      };
      const deduped = [entry, ...list.filter((x) => x.slug !== r.slug)].slice(
        0,
        10,
      );
      localStorage.setItem(key, JSON.stringify(deduped));
    } catch {}
  }, [r, images, country, city]);

  // NEW: Share handler with native share/clipboard + toast
  const onShare = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = r?.name || "Blunari restaurant";
    const text = r?.tagline || "Check this place on Blunari";
    (async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          toast.success("Link shared");
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
        }
      } catch {
        // user cancelled or unsupported
      }
    })();
  };

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!r?.id) throw new Error("Missing restaurant id");
      const res = await fetch("/api/gamification/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: r.id }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Check-in failed: [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      setCheckedIn(true);
      queryClient.invalidateQueries({ queryKey: ["gamification-profile"] });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const jsonLd = r
    ? {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: r.name,
        image: images[0],
        servesCuisine: r.cuisines,
        priceRange: r.price,
        telephone: r.phone || undefined,
        address: r.address || undefined,
        url:
          (typeof window !== "undefined" ? window.location.origin : "") +
          `/${country}/${city}/restaurants/${r.slug}`,
        aggregateRating: r.score
          ? {
              "@type": "AggregateRating",
              ratingValue: Math.round((r.score / 20) * 10) / 10,
              bestRating: 5,
              worstRating: 1,
              ratingCount: 24,
            }
          : undefined,
      }
    : null;

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

  if (error || !r) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div className="text-center">
          <p className="mb-4">Restaurant not found.</p>
          <a
            href={`/${country}/${city}/restaurants`}
            className={`underline ${theme.hover.text}`}
          >
            Back to restaurants
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt=""
              className="w-full h-[42vh] md:h-[56vh] object-cover"
            />
          ) : (
            <div className="w-full h-[42vh] md:h-[56vh]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        </div>
        <header className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <a
            href={`/${country}/${city}/restaurants`}
            className={`inline-flex items-center gap-2 text-sm ${theme.hover.text}`}
          >
            <ArrowLeft size={16} /> Back
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggle({ ...r, country, city })}
              className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} ${fav ? "text-red-400" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              aria-label={fav ? "Unsave" : "Save"}
            >
              <Heart size={16} fill={fav ? "currentColor" : "transparent"} />{" "}
              Save
            </button>
            <button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isLoading || checkedIn}
              className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} ${checkedIn ? "opacity-70" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              aria-label={checkedIn ? "Checked in" : "Check in"}
            >
              <CheckCircle2 size={16} />
              {checkedIn
                ? "Checked in"
                : checkinMutation.isLoading
                  ? "Checking…"
                  : "Check in"}
            </button>
            {/* NEW: Share button */}
            <button
              onClick={onShare}
              className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              aria-label="Share restaurant"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </header>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8 md:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-2.5 py-1.5 rounded-md text-sm mb-2 ring-1 ring-white/20">
              {r.score} · Editor’s Pick
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              {r.name}
            </h1>
            <div
              className={`mt-2 flex flex-wrap items-center gap-3 ${theme.text.muted}`}
            >
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} />
                {r.neighborhood}
              </span>
              {(r.cuisines || []).length ? (
                <>
                  <span>•</span>
                  <span>{(r.cuisines || []).join(" · ")}</span>
                </>
              ) : null}
              {r.price ? (
                <>
                  <span>•</span>
                  <span>{r.price}</span>
                </>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(r.tags || []).map((t) => (
                <span
                  key={t}
                  className={`text-xs px-2 py-1 rounded-full ${theme.bg.overlay} border ${theme.bg.border} ring-1 ring-white/10`}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {r.phone && (
                <a
                  href={`tel:${r.phone}`}
                  className={`px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} text-sm font-medium inline-flex items-center gap-2 ring-1 ring-white/5`}
                >
                  <Phone size={16} />
                  Call to reserve
                </a>
              )}
              {r.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} text-sm font-medium inline-flex items-center gap-2 ring-1 ring-white/5`}
                >
                  <ExternalLink size={16} />
                  Directions
                </a>
              )}
              {r.website && (
                <a
                  href={r.website}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} text-sm font-medium inline-flex items-center gap-2 ring-1 ring-white/5`}
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {r.description ? (
              <section>
                <h2 className="text-xl font-bold mb-2">About</h2>
                <p className={theme.text.secondary}>{r.description}</p>
              </section>
            ) : null}

            {images.length > 1 ? (
              <section>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <motion.img
                      key={idx}
                      src={img}
                      alt={
                        r?.name
                          ? `${r.name} photo ${idx + 1}`
                          : "Restaurant photo"
                      }
                      className="w-full h-40 object-cover rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      loading="lazy"
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section
              className={`rounded-xl ${theme.bg.overlay} border ${theme.bg.border} p-4`}
            >
              <h3 className="font-semibold mb-2">Location & Info</h3>
              {r.address && (
                <p className={`text-sm ${theme.text.muted}`}>{r.address}</p>
              )}
              <div className="mt-3 flex flex-col gap-2">
                {r.website && (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm underline ${theme.hover.text}`}
                  >
                    Website
                  </a>
                )}
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className={`text-sm underline ${theme.hover.text}`}
                  >
                    {r.phone}
                  </a>
                )}
                {r.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm underline ${theme.hover.text}`}
                  >
                    Get Directions
                  </a>
                )}
              </div>
            </section>

            <section
              className={`rounded-xl ${theme.bg.overlay} border ${theme.bg.border} p-4`}
            >
              <h3 className="font-semibold mb-2">Own this restaurant?</h3>
              <p className={`text-sm ${theme.text.muted}`}>
                Claim your profile to manage details, photos, and more.
              </p>
              <a
                href="/claim"
                className={`mt-3 inline-block px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} text-sm`}
              >
                Claim your profile
              </a>
            </section>
          </aside>
        </div>
      </main>

      {/* JSON-LD for SEO */}
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </div>
  );
}
