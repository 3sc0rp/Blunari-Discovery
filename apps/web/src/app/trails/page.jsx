"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import useMe from "@/utils/useMe";

export default function TrailsPage() {
  const { data: me } = useMe();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trails", me?.user?.id || null],
    queryFn: async () => {
      const res = await fetch("/api/trails", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `Failed to load trails [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const trails = useMemo(() => data?.trails || [], [data]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Trails</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Could not load trails</h1>
        <p className="text-gray-600 mb-4">
          {String(
            error?.message ||
              "Something went wrong while loading this. Try again.",
          )}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!trails.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Trails</h1>
        <p className="text-gray-600">Trails are coming soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Trails</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trails.map((t) => {
          const stepCount = t.step_count || 0;
          const completedCount = t.completed_count || 0;
          const percent =
            stepCount > 0 ? Math.round((completedCount / stepCount) * 100) : 0;
          return (
            <a
              key={t.id}
              href={`/trails/${t.slug}`}
              className="border rounded-lg p-4 hover:shadow-sm transition block"
              aria-label={`Open trail ${t.title}`}
            >
              <div className="flex flex-col h-full">
                <h2 className="text-lg font-medium mb-1">{t.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {t.description || ""}
                </p>
                <div className="mt-auto flex items-center justify-between text-sm text-gray-700">
                  <span>
                    {stepCount} step{stepCount === 1 ? "" : "s"}
                  </span>
                  {me?.user ? (
                    <span className="text-gray-800">{percent}% complete</span>
                  ) : (
                    <span className="text-gray-400">Sign in to track</span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
