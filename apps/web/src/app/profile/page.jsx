import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Award, Flame, Star } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ProfilePage() {
  const theme = useTheme();

  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/profile");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/gamification/profile, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const { data: badgesData } = useQuery({
    queryKey: ["gamification-badges"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/badges");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/gamification/badges, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const p = profileData?.profile || null;
  const badges = badgesData?.badges || [];

  const nextLevelXp = (p?.level || 1) * 100;
  const prevLevelXp = ((p?.level || 1) - 1) * 100;
  const inLevelXp = Math.max(0, (p?.xp || 0) - prevLevelXp);
  const inLevelMax = Math.max(1, nextLevelXp - prevLevelXp);
  const pct = Math.min(100, Math.round((inLevelXp / inLevelMax) * 100));

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div>Loading your profile…</div>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div className="text-center">
          <p className="mb-3">You need to sign in to view your profile.</p>
          <a href="/account/signin" className={`underline ${theme.hover.text}`}>
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Your Profile</h1>
        <p className={`${theme.text.muted} mt-1`}>
          Track your XP, streaks, and badges.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        {/* XP Card */}
        <section
          className={`rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-6`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm uppercase tracking-wide opacity-80">
                Level
              </div>
              <div className="text-3xl font-extrabold">{p.level}</div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <div
                className={`w-full h-3 rounded-full ${theme.bg.card} border ${theme.bg.border}`}
              >
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className={`text-xs ${theme.text.muted} mt-1`}>
                {inLevelXp} / {inLevelMax} XP to next level
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm uppercase tracking-wide opacity-80">
                Total XP
              </div>
              <div className="text-3xl font-extrabold">{p.xp}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`rounded-lg ${theme.bg.card} border ${theme.bg.border} p-3 flex items-center gap-2`}
            >
              <Flame size={16} />
              <div className="text-sm">
                Streak:{" "}
                <span className="font-semibold">{p.streak_checkins || 0}</span>{" "}
                days
              </div>
            </div>
            <div
              className={`rounded-lg ${theme.bg.card} border ${theme.bg.border} p-3 flex items-center gap-2`}
            >
              <Star size={16} />
              <div className="text-sm">
                Check-ins:{" "}
                <span className="font-semibold">{p.total_checkins || 0}</span>
              </div>
            </div>
            <div
              className={`rounded-lg ${theme.bg.card} border ${theme.bg.border} p-3 flex items-center gap-2`}
            >
              <Award size={16} />
              <div className="text-sm">
                Badges: <span className="font-semibold">{badges.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section
          className={`rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-6`}
        >
          <h2 className="text-xl font-bold mb-4">Badges</h2>
          {badges.length === 0 ? (
            <p className={theme.text.muted}>
              No badges yet — check in and explore to earn some!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-lg ${theme.bg.card} border ${theme.bg.border} p-4`}
                >
                  <div className="text-lg font-semibold">{b.name}</div>
                  {b.description ? (
                    <div className={`text-sm ${theme.text.muted} mt-1`}>
                      {b.description}
                    </div>
                  ) : null}
                  <div className={`text-xs ${theme.text.muted} mt-2`}>
                    Earned {new Date(b.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
