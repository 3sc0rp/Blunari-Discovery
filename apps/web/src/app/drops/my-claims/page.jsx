"use client";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../../hooks/useTheme";

export default function MyClaimsPage() {
  const theme = useTheme();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-claims"],
    queryFn: async () => {
      const res = await fetch("/api/drops/my-claims", {
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok) {
        if (res.status === 401) {
          return { unauthorized: true };
        }
        const text = await res.text().catch(() => "");
        throw new Error(
          `Failed to load claims [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    staleTime: 0,
  });

  const unauthorized = data?.unauthorized;
  const claims = Array.isArray(data?.claims) ? data.claims : [];

  return (
    <div
      className={`min-h-screen w-full font-inter ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            My Drop Claims
          </h1>

          {isLoading ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4 animate-pulse`}
            >
              <div className="h-5 w-40 bg-white/10 rounded mb-3" />
              <div className="h-4 w-64 bg-white/10 rounded mb-2" />
              <div className="h-4 w-48 bg-white/10 rounded" />
            </div>
          ) : isError ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4`}
            >
              <p className={theme.text.secondary}>
                Could not load your claims.
              </p>
              <button
                onClick={() => refetch()}
                className={`mt-3 px-4 py-2 rounded-lg font-medium ${theme.bg.accent} ${theme.bg.accentText} ${theme.brand.ring}`}
              >
                Retry
              </button>
            </div>
          ) : unauthorized ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4`}
            >
              <p className={theme.text.secondary}>
                You need to sign in to view your claims.
              </p>
              <a
                href="/account/signin?callbackUrl=/drops/my-claims"
                className={`inline-block mt-3 px-4 py-2 rounded-lg font-medium ${theme.bg.accent} ${theme.bg.accentText} ${theme.brand.ring}`}
              >
                Sign in
              </a>
            </div>
          ) : claims.length === 0 ? (
            <div
              className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4`}
            >
              <p className={theme.text.secondary}>
                You haven’t claimed any drops yet.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {claims.map((c) => {
                const date = c.claimed_at ? new Date(c.claimed_at) : null;
                return (
                  <li
                    key={c.id}
                    className={`border ${theme.bg.border} ${theme.bg.overlay} rounded-xl p-4 flex items-center justify-between`}
                  >
                    <div>
                      <div className="font-semibold">{c.title}</div>
                      <div className={`text-sm ${theme.text.secondary}`}>
                        {c.restaurant_name}
                      </div>
                      {date ? (
                        <div className={`text-xs ${theme.text.muted} mt-1`}>
                          {date.toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                    <a
                      href={`/restaurants/${c.restaurant_slug}`}
                      className={`text-sm ${theme.hover.text}`}
                    >
                      View
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
