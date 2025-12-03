import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "./useUser";

const KEY = "blunari:favorites";

export default function useFavorites() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  // Local fallback (signed-out or missing ids)
  const [localFavs, setLocalFavs] = useState([]);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setLocalFavs(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to read favorites", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(KEY, JSON.stringify(localFavs));
      }
    } catch (e) {
      console.error("Failed to persist favorites", e);
    }
  }, [localFavs]);

  // Remote favorites (signed-in)
  const { data, isFetching } = useQuery({
    queryKey: ["favorites"],
    enabled: !!user, // only fetch when signed in
    queryFn: async () => {
      const res = await fetch("/api/blunari/favorites");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/blunari/favorites, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const serverRestaurants = data?.restaurants || [];
  const serverBySlug = new Map(serverRestaurants.map((r) => [r.slug, r]));
  const serverSlugs = new Set(serverRestaurants.map((r) => r.slug));

  const isFavorite = useCallback(
    (slug) => {
      if (user) return serverSlugs.has(slug);
      return localFavs.includes(slug);
    },
    [user, serverSlugs, localFavs],
  );

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/blunari/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Add favorite failed [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (restaurant_id) => {
      const res = await fetch(
        `/api/blunari/favorites?restaurant_id=${restaurant_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        throw new Error(
          `Remove favorite failed [${res.status}] ${res.statusText}`,
        );
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Toggle function accepts either a slug (local) or a restaurant object (server preferred)
  const toggle = useCallback(
    (input, options = {}) => {
      // If signed out or input is a string, use local storage
      if (!user || typeof input === "string") {
        const slug = typeof input === "string" ? input : input?.slug;
        if (!slug) return;
        setLocalFavs((prev) =>
          prev.includes(slug)
            ? prev.filter((s) => s !== slug)
            : [...prev, slug],
        );
        return;
      }

      // Signed-in: use server API
      const r = input || {};
      // Try to use id if present; else resolve via country/city/slug
      const restaurant_id = r.id;
      if (isFavorite(r.slug)) {
        // remove
        if (restaurant_id) {
          removeMutation.mutate(restaurant_id);
        } else if (r.country && r.city && r.slug) {
          // We need id to DELETE; fallback: optimistic invalidate to refetch after POST to toggle off
          // As a simple robust path, try to resolve by POST/DELETE cycle is not available here; just refetch
          queryClient.invalidateQueries({ queryKey: ["favorites"] });
        }
      } else {
        if (restaurant_id) {
          addMutation.mutate({ restaurant_id });
        } else if (r.country && r.city && r.slug) {
          addMutation.mutate({
            country: r.country,
            city: r.city,
            slug: r.slug,
          });
        } else {
          // Fallback to local if we lack identifiers
          if (r.slug) {
            setLocalFavs((prev) =>
              prev.includes(r.slug)
                ? prev.filter((s) => s !== r.slug)
                : [...prev, r.slug],
            );
          }
        }
      }
    },
    [user, isFavorite, addMutation, removeMutation, queryClient],
  );

  // Expose a unified favorites list (slugs) for convenience
  const favorites = user ? Array.from(serverSlugs) : localFavs;

  return {
    favorites,
    isFavorite,
    toggle,
    loading: isFetching || addMutation.isLoading || removeMutation.isLoading,
  };
}
