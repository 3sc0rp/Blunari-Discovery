"use client";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useMe from "@/utils/useMe";

// SEO for Trail Detail (basic)
export async function generateMetadata({ params }) {
  const base = process.env.APP_URL || "";
  const slug = params?.slug;
  if (!slug) return {};
  try {
    const res = await fetch(`${base}/api/trails/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    const t = data?.trail;
    if (!t) return {};
    const title = `${t.title} – Blunari Discovery`;
    const description =
      t.description || "Complete this curated trail on Blunari.";
    return {
      title,
      description,
      openGraph: { title, description, url: `${base}/trails/${slug}` },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {}
  return {};
}

export default function TrailDetailPage(props) {
  const slug = props?.params?.slug;
  const { data: me } = useMe();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch, isError } = useQuery({
    queryKey: ["trail", slug, me?.user?.id || null],
    enabled: !!slug,
    queryFn: async () => {
      const res = await fetch(`/api/trails/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `Failed to load trail [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const trail = data?.trail;
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const progress = data?.progress || { total: 0, completed: 0 };

  const completeStep = useMutation({
    mutationFn: async (stepId) => {
      const res = await fetch(`/api/trails/complete-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stepId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Complete step failed [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: (payload) => {
      // Update detail + list cache
      qc.invalidateQueries({ queryKey: ["trail", slug] });
      qc.invalidateQueries({ queryKey: ["trails"] });

      // Toasts
      if (payload?.firstStepCompletion) {
        toast.success("Step completed");
      } else {
        toast.info("Already completed");
      }

      if (payload?.stampRewards?.xp) {
        const lvl = payload?.stampRewards?.level;
        const leveled = payload?.stampRewards?.justLeveledUp;
        toast.success(`+10 XP from visited${leveled ? " • Level up!" : ""}`);
      }

      if (payload?.trailJustCompleted) {
        const leveled = payload?.trailRewards?.justLeveledUp;
        toast.success(
          `Trail completed! +${payload?.trailRewards?.xpAdded || 50} XP${
            leveled ? " • Level up!" : ""
          }`,
        );
        if (payload?.trailRewards?.badge) {
          const b = payload.trailRewards.badge;
          const name = b?.name || b?.slug || "Trail Badge";
          toast.success("New badge", { description: name });
        }
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error("Could not complete step");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-7 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-8" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b py-4"
          >
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Could not load trail</h1>
        <p className="text-gray-600 mb-4">
          {String(error?.message || "Something went wrong")}
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

  if (!trail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Trail not found</h1>
        <a href="/trails" className="text-blue-600 underline">
          Back to Trails
        </a>
      </div>
    );
  }

  const pct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">{trail.title}</h1>
      {trail.description ? (
        <p className="text-gray-700 mb-4">{trail.description}</p>
      ) : null}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-700">Progress</span>
          <span className="text-gray-600">
            {progress.completed}/{progress.total} ({pct}%)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full"
            style={{ width: `${pct}%`, transition: "width 200ms ease" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y">
        {steps.map((s) => (
          <div
            key={s.step_id}
            className="py-4 flex items-center justify-between gap-4"
          >
            <div>
              <a
                href={`/${s.country}/${s.city}/restaurants/${s.restaurant_slug}`}
                className="font-medium hover:underline"
              >
                {s.order_index + 1}. {s.restaurant_name}
              </a>
              <div className="text-sm text-gray-600">
                {s.city.toUpperCase()}, {s.country.toUpperCase()}
              </div>
              {s.note ? (
                <div className="text-sm text-gray-700 mt-1">{s.note}</div>
              ) : null}
            </div>
            <div className="shrink-0">
              {me?.user ? (
                s.completed ? (
                  <button
                    disabled
                    className="px-3 py-2 rounded border text-sm bg-gray-100 text-gray-600"
                  >
                    Completed
                  </button>
                ) : (
                  <button
                    onClick={() => completeStep.mutate(s.step_id)}
                    disabled={completeStep.isLoading}
                    className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
                  >
                    Mark completed
                  </button>
                )
              ) : (
                <a
                  href="/account/signin"
                  className="text-sm text-blue-600 underline"
                >
                  Sign in
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
