import { useTheme } from "../hooks/useTheme";
import { useQuery } from "@tanstack/react-query";

export default function Footer() {
  const theme = useTheme();

  // Load cities from API (no more mock data)
  const { data } = useQuery({
    queryKey: ["footer-cities"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error("Failed to load cities");
      return res.json();
    },
    staleTime: 60_000, // 1 min
  });
  const cities = (data?.cities || []).slice(0, 6);

  return (
    <footer className={`${theme.text.primary} mt-12`} role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Brand gradient accent line to mirror the header and tie colors together */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#0EA5FF] to-[#2563EB] opacity-70 rounded-full mb-4" />
        <div
          className={`rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} ring-1 ring-white/5 p-6 md:p-8`}
        >
          {/* Expanded grid for better information architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-start">
            {/* Brand + tagline */}
            <div>
              <a
                href="/"
                className={`inline-flex items-center gap-2 rounded ${theme.brand.ring}`}
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
              <p className={`${theme.text.muted} mt-2 text-sm`}>
                Atlanta Dining Guide — curated for locals and food lovers.
              </p>
            </div>

            {/* Explore */}
            <nav aria-label="Explore" className="sm:justify-self-center">
              <h3 className="text-sm font-semibold mb-2">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/restaurants"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Restaurants
                  </a>
                </li>
                <li>
                  <a
                    href="/trails"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Trails
                  </a>
                </li>
                <li>
                  <a
                    href="/lists"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Lists
                  </a>
                </li>
                <li>
                  <a
                    href="/feed"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Video Feed
                  </a>
                </li>
                <li>
                  <a
                    href="/#todays-drop"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Today’s Drop
                  </a>
                </li>
              </ul>
            </nav>

            {/* Account */}
            <nav aria-label="Account" className="sm:justify-self-center">
              <h3 className="text-sm font-semibold mb-2">Account</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/drops/my-claims"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    My Claims
                  </a>
                </li>
                <li>
                  <a
                    href="/invite"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Invite Friends
                  </a>
                </li>
                <li>
                  <a
                    href="/passport"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Passport
                  </a>
                </li>
                <li>
                  <a
                    href="/favorites"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Favorites
                  </a>
                </li>
                <li>
                  <a
                    href="/profile"
                    className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                  >
                    Profile
                  </a>
                </li>
                {/* Remove Admin link from footer to avoid exposure */}
              </ul>
            </nav>

            {/* Cities from API */}
            <nav aria-label="Cities" className="sm:justify-self-end">
              <h3 className="text-sm font-semibold mb-2">Cities</h3>
              <ul className="space-y-2 text-sm">
                {cities.map((c) => (
                  <li key={`${c.country}-${c.city}`}>
                    <a
                      href={`/${c.country}/${c.city}/restaurants`}
                      className={`${theme.hover.text} focus:outline-none ${theme.brand.ring} rounded`}
                    >
                      {c.name}
                    </a>
                  </li>
                ))}
                {cities.length === 0 ? (
                  <li className={`${theme.text.muted}`}>Coming soon</li>
                ) : null}
              </ul>
            </nav>
          </div>

          {/* Bottom bar */}
          <div
            className={`mt-6 pt-6 border-t ${theme.bg.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
          >
            <p className={`${theme.text.muted} text-xs`}>
              © {new Date().getFullYear()} Blunari. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 text-xs items-center">
              <a href="/#main-content" className={`${theme.hover.text}`}>
                Skip to content
              </a>
              <span aria-hidden="true" className={`${theme.text.muted}`}>
                •
              </span>
              <a href="/claim" className={`${theme.hover.text}`}>
                Own a restaurant? Claim
              </a>
              <span aria-hidden="true" className={`${theme.text.muted}`}>
                •
              </span>
              <a href="/catering" className={`${theme.hover.text}`}>
                Catering
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
