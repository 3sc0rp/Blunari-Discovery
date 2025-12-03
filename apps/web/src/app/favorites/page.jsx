"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import RestaurantCard from "@/components/RestaurantCard";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { data: user, loading } = useUser();
  const [error, setError] = useState(null);
  const [localSlugs, setLocalSlugs] = useState([]);

  // Read local favorites for signed-out users (slugs only)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("blunari:favorites");
        setLocalSlugs(raw ? JSON.parse(raw) : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const {
    data: data,
    isLoading,
    isError,
    error: rqError,
  } = useQuery({
    queryKey: ["favorites:list", user?.id || "anon"],
    enabled: !!user, // only fetch when signed in
    queryFn: async () => {
      try {
        const res = await fetch("/api/blunari/favorites", { method: "GET" });
        if (!res.ok) {
          if (res.status === 401) return { favorites: [], restaurants: [] };
          throw new Error(
            `When fetching /api/blunari/favorites, the response was [${res.status}] ${res.statusText}`,
          );
        }
        return res.json();
      } catch (e) {
        console.error(e);
        setError("Could not load favorites");
        return { favorites: [], restaurants: [] };
      }
    },
    staleTime: 30_000,
  });

  const restaurants = useMemo(() => data?.restaurants || [], [data]);

  const title = useMemo(() => {
    if (loading) return "Loading...";
    if (!user) return "Your saved places";
    return `${user.name ? user.name + "'s" : "Your"} saved places`;
  }, [user, loading]);

  const hasItems = Array.isArray(restaurants) && restaurants.length > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={20} className="text-pink-500" />
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>

      {/* Signed in: show server-backed favorites */}
      {user ? (
        isLoading ? (
          <p className="text-sm text-gray-400">Loading your favorites...</p>
        ) : isError || error ? (
          <p className="text-sm text-red-400">
            {error || rqError?.message || "Something went wrong"}
          </p>
        ) : !hasItems ? (
          <div className="rounded-xl border border-white/10 p-6 text-center">
            <p className="text-gray-300">No favorites yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Tap the heart on any place to save it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <RestaurantCard
                key={r.id || r.slug}
                restaurant={r}
                country={r.country}
                city={r.city}
              />
            ))}
          </div>
        )
      ) : (
        // Signed out: encourage sign in, show count of local slugs if present
        <div className="rounded-xl border border-white/10 p-6 text-center">
          <p className="text-gray-300 mb-1">
            Sign in to save favorites to your account.
          </p>
          {localSlugs.length > 0 ? (
            <p className="text-gray-400 text-sm">
              You have {localSlugs.length} saved{" "}
              {localSlugs.length === 1 ? "place" : "places"} on this device.
            </p>
          ) : (
            <p className="text-gray-400 text-sm">No favorites yet.</p>
          )}
          <a
            href="/account/signin"
            className="inline-block mt-4 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
          >
            Sign in
          </a>
        </div>
      )}
    </main>
  );
}
