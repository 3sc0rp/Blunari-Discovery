"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

export const metadata = {
  title: "Your Passport",
  description: "See your XP, level, stamps, and badges on Blunari Discovery.",
};

export default function PassportPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["passport"],
    queryFn: async () => {
      const res = await fetch("/api/passport", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          return { unauth: true };
        }
        const text = await res.text().catch(() => "");
        throw new Error(
          `/api/passport failed [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
  });

  const unauth = data?.unauth;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Passport</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse rounded" />
          <div className="h-28 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse rounded" />
          <div className="h-28 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse rounded" />
        </div>
        <div className="mt-8 h-64 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse rounded" />
      </div>
    );
  }

  if (error) {
    console.error(error);
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Passport</h1>
        <div className="p-4 rounded border border-red-300 bg-red-50 text-red-700 dark:bg-[#2a1212] dark:border-red-800">
          Something went wrong loading your passport.
          <button onClick={() => refetch()} className="ml-3 underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (unauth) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Your Passport</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Sign in to see your XP, level, stamps, and badges.
        </p>
        <a
          href="/account/signin?callbackUrl=/passport"
          className="inline-block px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black"
        >
          Sign in
        </a>
      </div>
    );
  }

  const xp = data?.profile?.xp ?? 0;
  const level = data?.profile?.level ?? 1;
  const xpInLevel = data?.profile?.xpInLevel ?? 0;
  const progress = data?.profile?.progress ?? 0;
  const stampsTotal = data?.stamps?.total ?? 0;
  const recent = data?.stamps?.recent ?? [];
  const earned = data?.badges?.earned ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Passport</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">XP: {xp}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
          <div className="text-3xl font-bold">{level}</div>
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 dark:bg-[#222] rounded">
              <div
                className="h-2 bg-black dark:bg-white rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {xpInLevel}/100 to next level
            </div>
          </div>
        </div>

        <div className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Stamps</div>
          <div className="text-3xl font-bold">{stampsTotal}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visited restaurants
          </div>
        </div>

        <div className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Badges</div>
          <div className="text-3xl font-bold">{earned.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Earned so far
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Recent stamps</h2>
          {recent.length === 0 ? (
            <div className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222] text-gray-600 dark:text-gray-300">
              No stamps yet. Go explore — mark a place as visited and earn XP!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-[#222] rounded border bg-white dark:bg-[#111] dark:border-[#222]">
              {recent.map((row, idx) => {
                const date = new Date(row.first_stamped_at);
                const dateStr = isNaN(date.getTime())
                  ? ""
                  : date.toLocaleDateString();
                const href = `/${row.country}/${row.city}/restaurants/${row.slug}`;
                return (
                  <li
                    key={idx}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <a href={href} className="font-medium hover:underline">
                        {row.name}
                      </a>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {row.city?.toUpperCase?.()} • {dateStr}
                      </div>
                    </div>
                    <a
                      href={href}
                      className="text-sm text-gray-600 underline dark:text-gray-300"
                    >
                      View
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Badges</h2>
          {earned.length === 0 ? (
            <div className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222] text-gray-600 dark:text-gray-300">
              You haven't earned any badges yet. First stamp gets you started.
            </div>
          ) : (
            <ul className="space-y-3">
              {earned.map((b, idx) => (
                <li
                  key={idx}
                  className="p-4 rounded border bg-white dark:bg-[#111] dark:border-[#222]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl" aria-hidden>
                      {b.icon || "🏅"}
                    </div>
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {b.description}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
