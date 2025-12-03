import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";
import { Toaster } from "sonner"; // add global toaster for favorites undo and other toasts
// NEW: hooks and icons for mobile nav
import { useEffect, useState } from "react";
import { PlaySquare, UtensilsCrossed, Gift, Stamp } from "lucide-react";

// Default SEO (title template + description + OG defaults)
export const metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Blunari Discovery",
    template: "Blunari Discovery – %s",
  },
  description:
    "Blunari Discovery: find great restaurants, complete curated trails, earn Passport XP, and catch daily drops in your city.",
  openGraph: {
    siteName: "Blunari Discovery",
    type: "website",
    url: process.env.APP_URL || "",
    title: "Blunari Discovery",
    description:
      "Restaurant discovery with curated trails, Passport XP, and daily drops.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blunari Discovery",
    description:
      "Restaurant discovery with curated trails, Passport XP, and daily drops.",
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  // Apply the brand-matched background and text globally so Header/Footer match every page
  const theme = useTheme();

  // NEW: state for mobile bottom nav (active path + city-scoped restaurants link)
  const [pathname, setPathname] = useState("/");
  const [restaurantsHref, setRestaurantsHref] = useState("/restaurants");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPathname(window.location.pathname + window.location.hash);
    try {
      const raw = localStorage.getItem("blunari.city");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.country && parsed?.city) {
          setRestaurantsHref(`/${parsed.country}/${parsed.city}/restaurants`);
        }
      }
    } catch {}
  }, []);

  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Blunari – Atlanta Dining Guide",
    url: typeof window !== "undefined" ? window.location.origin : undefined,
    potentialAction: {
      "@type": "SearchAction",
      target: `${typeof window !== "undefined" ? window.location.origin : ""}/restaurants?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // NEW: helper to mark a tab active
  const isActive = (key) => {
    if (!pathname) return false;
    if (key === "feed") return pathname.includes("/feed");
    if (key === "restaurants") return pathname.includes("/restaurants");
    if (key === "drop") return pathname.includes("#todays-drop");
    if (key === "passport") return pathname.includes("/passport");
    return false;
  };

  return (
    <QueryClientProvider client={queryClient}>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black bg-black/70 text-white"
      >
        Skip to content
      </a>
      <div
        className={`font-inter antialiased min-h-screen flex flex-col ${theme.text.primary}`}
        style={{ background: theme.background }}
      >
        <Header />
        {/* add bottom padding on mobile so content isn't hidden behind mobile nav */}
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        {/* NEW: Mobile sticky bottom nav (md:hidden) */}
        <nav
          aria-label="Quick navigation"
          className={`fixed bottom-0 left-0 right-0 md:hidden ${theme.bg.overlay} border-t ${theme.bg.border} ring-1 ring-white/5`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-4">
            <li>
              <a
                href="/feed"
                title="Video Feed"
                aria-label="Video Feed"
                aria-current={isActive("feed") ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${isActive("feed") ? "text-white" : theme.text.muted} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                <PlaySquare size={20} />
                <span>Feed</span>
              </a>
            </li>
            <li>
              <a
                href={restaurantsHref}
                title="Restaurants"
                aria-label="Restaurants"
                aria-current={isActive("restaurants") ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${isActive("restaurants") ? "text-white" : theme.text.muted} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                <UtensilsCrossed size={20} />
                <span>Eat</span>
              </a>
            </li>
            <li>
              <a
                href="/#todays-drop"
                title="Today’s Drop"
                aria-label="Today’s Drop"
                aria-current={isActive("drop") ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${isActive("drop") ? "text-white" : theme.text.muted} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                <Gift size={20} />
                <span>Drop</span>
              </a>
            </li>
            <li>
              <a
                href="/passport"
                title="Passport"
                aria-label="Passport"
                aria-current={isActive("passport") ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-2 text-xs ${isActive("passport") ? "text-white" : theme.text.muted} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
              >
                <Stamp size={20} />
                <span>Passport</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      {/* Toaster for UX feedback (favorites undo, etc.) */}
      <Toaster position="top-center" richColors closeButton theme="dark" />
      {/* JSON-LD WebSite with search action */}
      <script type="application/ld+json">{JSON.stringify(webSiteLd)}</script>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        /* Respect users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </QueryClientProvider>
  );
}
