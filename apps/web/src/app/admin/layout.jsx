import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import {
  BarChart3,
  MapPinned,
  UtensilsCrossed,
  Gift,
  Route,
  BadgeCheck,
  Video,
  List,
  ClipboardList,
  Truck,
  Upload,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const [allowed, setAllowed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/admin/whoami");
        if (!res.ok)
          throw new Error(`whoami [${res.status}] ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          setAllowed(Boolean(json?.isAdmin));
        }
      } catch (e) {
        if (!cancelled) setError("Unable to verify admin access");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking access…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Admin access required</h1>
        <p className="text-gray-500 text-center max-w-md">
          Your account isn’t on the admin allowlist. Ask an admin to add your
          email to the admin_users table in Supabase.
        </p>
        <a className="text-blue-600 underline" href="/">
          Go home
        </a>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/cities", label: "Cities", icon: MapPinned },
    { href: "/admin/restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { href: "/admin/drops", label: "Drops", icon: Gift },
    { href: "/admin/trails", label: "Trails", icon: Route },
    { href: "/admin/badges", label: "Badges", icon: BadgeCheck },
    { href: "/admin/videos", label: "Videos", icon: Video },
    { href: "/admin/lists", label: "Curated Lists", icon: List },
    { href: "/admin/claims", label: "Claims", icon: ClipboardList },
    { href: "/admin/catering", label: "Catering", icon: Truck },
    { href: "/admin/import", label: "Import", icon: Upload },
  ];

  const isActive = (href) => (pathname || "").startsWith(href);

  return (
    <>
      {/* Prevent indexing */}
      <meta name="robots" content="noindex,nofollow" />
      <div
        className={`min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] ${theme.text.primary}`}
        style={{ background: theme.background }}
      >
        <aside
          className={`hidden md:block sticky top-0 self-start h-screen p-4 space-y-2 border-r ${theme.bg.border} ${theme.bg.overlay} ring-1 ring-white/5`}
        >
          <div className="px-2 py-1 text-xs uppercase tracking-wide opacity-70">
            Admin
          </div>
          <nav aria-label="Admin Navigation" className="space-y-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.bg.border} ${isActive(l.href) ? "bg-white/10 text-white" : theme.hover.bg} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{l.label}</span>
                </a>
              );
            })}
          </nav>
        </aside>
        <main className="p-4 md:p-6">
          <div
            className={`mb-4 p-3 rounded-lg border ${theme.bg.border} ${theme.bg.overlay} ring-1 ring-white/5`}
          >
            <div className="text-sm opacity-80">
              You’re in the Admin area. Changes are live.
            </div>
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
