import { useState, useEffect } from "react";
import { Search, Menu, X, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import useUser from "@/utils/useUser";

export default function Header() {
  const theme = useTheme();
  const { data: user, loading: userLoading } = useUser();

  // Minimal state
  const [pathname, setPathname] = useState("/");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname + window.location.hash);
    }
  }, []);

  // Keep a lightweight admin check (server-only route, safe)
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/admin/whoami");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setIsAdmin(Boolean(json?.isAdmin));
      } catch {}
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const nav = [
    { href: "/restaurants", label: "Restaurants" },
    { href: "/trails", label: "Trails" },
    { href: "/feed", label: "Feed" },
    { href: "/#todays-drop", label: "Today’s Drop" },
    { href: "/passport", label: "Passport" },
  ];

  const isActive = (href) => pathname.startsWith(href) || pathname === href;
  const linkBase = `px-3 py-2 rounded-md text-sm ${theme.hover.bg}`;
  const activeStyles = "bg-white/10 text-white";

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur bg-black/30 border-b ${theme.bg.border}`}
      role="banner"
    >
      {/* Skip to content link for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-black/80 focus:text-white"
      >
        Skip to content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <nav className="flex items-center justify-between" aria-label="Main">
          {/* Left: Brand */}
          <a
            href="/"
            className={`flex items-center gap-2 rounded-md ${theme.brand.ring}`}
            aria-label="Blunari home"
          >
            <img
              src="https://ucarecdn.com/9deeeaa3-91cd-4e26-a86d-af162a57616b/-/format/auto/"
              alt="Blunari logo"
              className="h-7 w-auto select-none"
              draggable="false"
            />
            <span
              className={`hidden sm:inline font-extrabold tracking-wide text-lg ${theme.brand.textGradient}`}
            >
              Blunari
            </span>
          </a>

          {/* Center: Primary nav (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`${linkBase} ${isActive(item.href) ? activeStyles : ""}`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right: Utilities */}
          <div className="flex items-center gap-2">
            <a
              href="/search"
              className={`inline-flex items-center gap-2 ${linkBase}`}
              aria-label="Search"
            >
              <Search size={16} />
              <span className="hidden sm:inline text-sm">Search</span>
            </a>

            {/* Remove Admin from public UI to avoid discoverability */}
            {/* {isAdmin ? (
              <a
                href="/admin"
                aria-current={pathname.includes("/admin") ? "page" : undefined}
                className={`${linkBase} ${pathname.includes("/admin") ? activeStyles : ""}`}
                aria-label="Admin"
              >
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">Admin</span>
              </a>
            ) : null} */}

            {!user && !userLoading ? (
              <a href="/account/signin" className={`${linkBase}`}>
                <LogIn size={16} className="mr-1" />{" "}
                <span className="hidden sm:inline">Sign in</span>
              </a>
            ) : null}
            {user ? (
              <a href="/account/logout" className={`${linkBase}`}>
                <LogOut size={16} className="mr-1" />{" "}
                <span className="hidden sm:inline">Sign out</span>
              </a>
            ) : null}

            {/* Mobile menu toggle */}
            <button
              className={`md:hidden inline-flex items-center justify-center ${linkBase}`}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div
            className={`md:hidden mt-3 rounded-lg ${theme.bg.overlay} border ${theme.bg.border} p-2`}
          >
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`block ${linkBase} w-full ${isActive(item.href) ? activeStyles : ""}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/search"
                  className={`block ${linkBase} w-full`}
                  onClick={() => setMobileOpen(false)}
                >
                  Search
                </a>
              </li>
              {/* Admin intentionally hidden from mobile menu as well */}
              {!user && !userLoading ? (
                <li>
                  <a
                    href="/account/signin"
                    className={`block ${linkBase} w-full`}
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </a>
                </li>
              ) : null}
              {user ? (
                <li>
                  <a
                    href="/account/logout"
                    className={`block ${linkBase} w-full`}
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign out
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}
