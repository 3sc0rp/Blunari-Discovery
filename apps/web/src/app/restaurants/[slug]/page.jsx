import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import {
  MapPin,
  Phone,
  ExternalLink,
  ArrowLeft,
  Heart,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { motion } from "motion/react";
import useFavorites from "../../../utils/useFavorites";
import useStamp from "../../../utils/useStamp";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner"; // NEW: for share feedback

// SEO for Restaurant Detail
export async function generateMetadata({ params }) {
  const base = process.env.APP_URL || "";
  const slug = params?.slug;
  if (!slug) return {};
  try {
    const url = `${base}/api/blunari/restaurants/${encodeURIComponent(slug)}?country=us&city=atlanta`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    const r = data?.restaurant;
    const images = Array.isArray(data?.images)
      ? data.images
      : Array.isArray(r?.images)
        ? r.images
        : [];
    if (!r) return {};
    const title = `${r.name} – Blunari Discovery`;
    const desc = r.description
      ? `${r.description}`
      : `Explore ${r.name} on Blunari Discovery.`;
    const image = images?.[0]?.url || images?.[0] || null;
    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        url: `${base}/restaurants/${encodeURIComponent(slug)}`,
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: image ? [image] : undefined,
      },
    };
  } catch {}
  return {};
}

export default function RestaurantDetailPage({ params: { slug } }) {
  const theme = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const { markVisited, loading: stamping } = useStamp();

  // Resolve current city from localStorage (fallback to US/Atlanta if missing)
  const [citySel, setCitySel] = useState(null);
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("blunari.city")
          : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.country && parsed?.city) setCitySel(parsed);
      }
    } catch {}
    if (!citySel) setCitySel({ country: "us", city: "atlanta" });
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["restaurant", citySel?.country, citySel?.city, slug],
    enabled: !!citySel && !!slug,
    queryFn: async () => {
      const url = new URL(
        `/api/blunari/restaurants/${encodeURIComponent(slug)}`,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost",
      );
      url.searchParams.set("country", citySel.country);
      url.searchParams.set("city", citySel.city);
      const res = await fetch(url.toString().replace(/^https?:\/\/[^/]+/, ""));
      if (!res.ok) {
        if (res.status === 404) return { restaurant: null, images: [] };
        throw new Error(
          `When fetching restaurant, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const r = data?.restaurant || null;
  const images = Array.isArray(data?.images) ? data.images : r?.images || [];
  const fav = r ? isFavorite(r.slug) : false;

  // NEW: add to "recently viewed" rail in localStorage (kept small and simple)
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
        image: images?.[0]?.url || images?.[0] || null,
        country: citySel?.country || "us",
        city: citySel?.city || "atlanta",
        ts: Date.now(),
      };
      const deduped = [entry, ...list.filter((x) => x.slug !== r.slug)].slice(
        0,
        10,
      );
      localStorage.setItem(key, JSON.stringify(deduped));
    } catch {}
  }, [r, images, citySel]);

  // NEW: share handler (native share > clipboard > no-op)
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
        // user canceled or unsupported
      }
    })();
  };

  const jsonLd = r
    ? {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: r.name,
        image: images?.[0]?.url || images?.[0] || undefined,
        servesCuisine: r.cuisines,
        priceRange: r.price,
        telephone: r.phone || undefined,
        address: r.address || undefined,
        url: `${typeof window !== "undefined" ? window.location.origin : ""}/restaurants/${r.slug}`,
      }
    : null;

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
              src={images[0].url || images[0]}
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
            href="/restaurants"
            className={`inline-flex items-center gap-2 text-sm ${theme.hover.text}`}
          >
            <ArrowLeft size={16} /> Back
          </a>
          {r ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  toggle({
                    ...r,
                    country: citySel?.country,
                    city: citySel?.city,
                  })
                }
                className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} ${fav ? "text-red-400" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                aria-label={fav ? "Unsave" : "Save"}
              >
                <Heart size={16} fill={fav ? "currentColor" : "transparent"} />{" "}
                Save
              </button>
              <button
                onClick={() =>
                  markVisited({
                    country: citySel?.country,
                    city: citySel?.city,
                    slug: r.slug,
                  })
                }
                disabled={stamping}
                className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                aria-label="Mark visited"
              >
                <CheckCircle2 size={16} /> Mark visited
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
          ) : null}
        </header>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8 md:pt-28">
          {isLoading ? (
            <div className="max-w-3xl">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-10 w-2/3 bg-white/10 rounded animate-pulse" />
            </div>
          ) : !r ? (
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold">Not Found</h1>
              <p className={`${theme.text.muted} mt-2`}>
                This restaurant isn't published or doesn't exist.{" "}
                <a href="/restaurants" className="underline">
                  See all
                </a>
              </p>
            </div>
          ) : (
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-2.5 py-1.5 rounded-md text-sm mb-2 ring-1 ring-white/20">
                {r.score || 90} · Editor’s Pick
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                {r.name}
              </h1>
              <div
                className={`mt-2 flex flex-wrap items-center gap-3 ${theme.text.muted}`}
              >
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {r.neighborhood || r.city}
                </span>
                {r.cuisines?.length ? (
                  <>
                    <span>•</span>
                    <span>{r.cuisines.join(" · ")}</span>
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
                    <Phone size={16} /> Call to reserve
                  </a>
                )}
                {r.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg} text-sm font-medium inline-flex items-center gap-2 ring-1 ring-white/5`}
                  >
                    <ExternalLink size={16} /> Directions
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {r && (
        <main className="px-4 sm:px-6 py-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <section>
                <h2 className="text-xl font-bold mb-2">About</h2>
                <p className={theme.text.secondary}>{r.description}</p>
              </section>

              {/* Highlights */}
              {r.highlights?.length ? (
                <section>
                  <h2 className="text-xl font-bold mb-2">Highlights</h2>
                  <div className="flex flex-wrap gap-2">
                    {r.highlights.map((h) => (
                      <span
                        key={h}
                        className={`text-xs px-3 py-2 rounded-full border ${theme.bg.border} ${theme.bg.overlay}`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Gallery */}
              {images?.length ? (
                <section>
                  <h2 className="text-xl font-bold mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <motion.img
                        key={idx}
                        src={img.url || img}
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

            {/* Sidebar */}
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
      )}
      {/* JSON-LD for SEO */}
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </div>
  );
}
