"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useMe from "@/utils/useMe";
import useStamp from "@/utils/useStamp";
import { toast } from "sonner";
import {
  Heart,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Share2,
  Loader2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

export const metadata = {
  title: "Vertical Video Feed",
  description:
    "Watch a full-screen vertical feed of dining videos on Blunari Discovery.",
  openGraph: {
    title: "Blunari – Video Feed",
    description:
      "Watch a full-screen vertical feed of dining videos on Blunari Discovery.",
    url: `${process.env.APP_URL || ""}/feed`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blunari – Video Feed",
    description:
      "Watch a full-screen vertical feed of dining videos on Blunari Discovery.",
  },
  alternates: {
    canonical: `${process.env.APP_URL || ""}/feed`,
  },
};

function useVideoFeed() {
  return useQuery({
    queryKey: ["video-feed"],
    queryFn: async () => {
      const res = await fetch("/api/videos/feed?limit=20", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          `When fetching /api/videos/feed, got [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      return Array.isArray(json?.videos) ? json.videos : [];
    },
    staleTime: 10_000,
  });
}

function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (video_id) => {
      const res = await fetch("/api/videos/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Like failed [${res.status}] ${res.statusText} ${text}`,
        );
      }
      return res.json();
    },
    onSuccess: (data, video_id) => {
      qc.setQueryData(["video-feed"], (prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((v) => {
          if (v.id === video_id) {
            const likes =
              typeof data?.likes === "number"
                ? data.likes
                : (v.likes || 0) + (data?.liked ? 1 : -1);
            return { ...v, liked: !!data?.liked, likes: Math.max(0, likes) };
          }
          return v;
        });
      });
      // Optional subtle feedback
      if (data?.liked === true) {
        toast.success("Liked");
      } else if (data?.liked === false) {
        toast("Unliked");
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error("Could not update like");
    },
  });
}

function useLogEvent() {
  return useMutation({
    mutationFn: async ({ video_id, type, metadata }) => {
      const res = await fetch("/api/videos/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id, type, metadata }),
      });
      if (!res.ok) {
        throw new Error(`Event log failed [${res.status}] ${res.statusText}`);
      }
      return res.json();
    },
  });
}

export default function FeedPage() {
  const { data: user } = useMe();
  const { data: videos = [], isLoading, error } = useVideoFeed();
  const likeMutation = useToggleLike();
  const { mutate: logEvent } = useLogEvent();
  const { markVisited, loading: stamping } = useStamp();
  const qc = useQueryClient();

  const containerRef = useRef(null);
  const videoRefs = useRef(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const lastViewSentAt = useRef(new Map()); // videoId -> ts
  // NEW: per-active muted state (default true)
  const [muted, setMuted] = useState(true);
  // NEW: one-time keyboard tips banner
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem("blunari.feedTipsSeen");
      if (!seen) {
        setShowTips(true);
        const t = setTimeout(() => setShowTips(false), 6000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const dismissTips = useCallback(() => {
    setShowTips(false);
    try {
      localStorage.setItem("blunari.feedTipsSeen", "1");
    } catch {}
  }, []);

  // Autoplay/pause logic via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const options = { root: container, rootMargin: "0px", threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idAttr = entry.target.getAttribute("data-index");
        const idx = idAttr ? parseInt(idAttr, 10) : NaN;
        const videoEl = videoRefs.current.get(idx);
        if (!videoEl) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          setActiveIndex(idx);
          // Ensure mute state is respected when switching
          try {
            videoEl.muted = muted;
          } catch {}
          // play
          const p = videoEl.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
          // log view (debounced ~ 35s per user/video)
          const vid = videos[idx]?.id;
          if (vid) {
            const now = Date.now();
            const last = lastViewSentAt.current.get(vid) || 0;
            if (now - last > 35_000) {
              lastViewSentAt.current.set(vid, now);
              logEvent({ video_id: vid, type: "view" });
            }
          }
        } else {
          // pause
          if (!videoEl.paused) videoEl.pause();
        }
      });
    }, options);

    const items = container.querySelectorAll("[data-index]");
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos, logEvent, muted]);

  useEffect(() => {
    // Ensure only activeIndex plays and mute matches state
    const current = videoRefs.current.get(activeIndex);
    videoRefs.current.forEach((el, idx) => {
      if (!el) return;
      try {
        el.muted = muted;
      } catch {}
      if (idx === activeIndex) {
        const p = el.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else if (!el.paused) {
        el.pause();
      }
    });
    return () => {};
  }, [activeIndex, muted]);

  // Keyboard navigation & quick actions for world-class UX
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable)
        return;
      // Navigation
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(videos.length - 1, i + 1));
      }
      if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      }
      // Actions: like (l), save (s), visited (v), share (Shift+S), mute (m)
      const v = videos[activeIndex];
      if (!v) return;
      if (e.key.toLowerCase() === "l") onToggleLike(v);
      if (e.key.toLowerCase() === "s" && !e.shiftKey) onToggleFavorite(v);
      if (e.key.toLowerCase() === "v") onVisited(v);
      if (e.key.toLowerCase() === "s" && e.shiftKey) onShare(v);
      if (e.key.toLowerCase() === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, videos]);

  const requireAuth = useCallback(() => {
    if (!user) {
      window.location.href = "/account/signin?callbackUrl=/feed";
      return true;
    }
    return false;
  }, [user]);

  const onToggleLike = useCallback(
    (video) => {
      if (requireAuth()) return;
      likeMutation.mutate(video.id);
    },
    [likeMutation, requireAuth],
  );

  const onToggleFavorite = useCallback(
    async (video) => {
      if (requireAuth()) return;
      try {
        if (video.favorited) {
          const res = await fetch(
            `/api/blunari/favorites?restaurant_id=${video.restaurant_id}`,
            { method: "DELETE" },
          );
          if (!res.ok) throw new Error("delete failed");
          toast("Removed from Saved");
        } else {
          const res = await fetch("/api/blunari/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restaurant_id: video.restaurant_id }),
          });
          if (!res.ok) throw new Error("post failed");
          toast.success("Saved");
        }
        // optimistic update in feed
        qc.setQueryData(["video-feed"], (prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((v) =>
            v.id === video.id ? { ...v, favorited: !v.favorited } : v,
          );
        });
      } catch (e) {
        console.error(e);
        toast.error("Could not update saved");
      }
    },
    [requireAuth, qc],
  );

  const onVisited = useCallback(
    (video) => {
      if (requireAuth()) return;
      markVisited({ restaurant_id: video.restaurant_id });
      // also log complete
      logEvent({ video_id: video.id, type: "complete" });
      // Optimistically set stamped
      qc.setQueryData(["video-feed"], (prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((v) =>
          v.id === video.id ? { ...v, stamped: true } : v,
        );
      });
    },
    [markVisited, requireAuth, logEvent, qc],
  );

  const onShare = useCallback(
    async (video) => {
      const shareUrl = `${process.env.APP_URL || ""}/feed?video=${video.id}`;
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: video.restaurant_name,
            text: video.caption || "",
            url: shareUrl,
          });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied");
        }
        logEvent({ video_id: video.id, type: "share" });
      } catch (e) {
        // user cancelled or unsupported; ignore silently
      }
    },
    [logEvent],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const current = videoRefs.current.get(activeIndex);
      try {
        if (current) current.muted = next;
      } catch {}
      return next;
    });
  }, [activeIndex]);

  // Rendering
  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-black">
        <div className="h-full grid grid-rows-1">
          <div className="relative h-screen">
            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
            <div className="absolute inset-x-0 bottom-0 p-4 pt-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
              <div className="max-w-[900px] mx-auto">
                <div className="h-5 w-40 bg-white/20 rounded mb-2" />
                <div className="h-4 w-64 bg-white/10 rounded mb-4" />
                <div className="flex gap-3">
                  <div className="h-8 w-16 bg-white/10 rounded" />
                  <div className="h-8 w-20 bg-white/10 rounded" />
                  <div className="h-8 w-24 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Something went wrong while loading this. Try again.
          </p>
          <button
            className="mt-3 px-4 py-2 bg-black text-white rounded"
            onClick={() => window.location.reload()}
            aria-label="Retry loading feed"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!videos || videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-xl font-semibold">No videos yet</p>
          <p className="text-gray-600 mt-1">No videos yet. Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white"
    >
      {videos.map((v, idx) => (
        <section
          key={v.id}
          data-index={idx}
          className="relative h-screen w-full flex items-center justify-center snap-start"
        >
          <video
            ref={(el) => el && videoRefs.current.set(idx, el)}
            src={v.video_url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            loop
            controls={false}
            preload="metadata"
          />

          {/* Overlay gradient for readability */}
          <div className="absolute inset-x-0 bottom-0 p-4 pt-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <div className="max-w-[900px] mx-auto">
              <a
                href={`/${v.country}/${v.city}/restaurants/${v.restaurant_slug}`}
                className="font-semibold text-white text-lg underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm"
              >
                {v.restaurant_name}
              </a>
              {v.caption ? (
                <p className="text-sm text-gray-200 mt-1 whitespace-pre-wrap">
                  {v.caption}
                </p>
              ) : null}

              {/* NEW: one-time keyboard tips bar */}
              {showTips ? (
                <div className="mt-3 flex items-center gap-3 rounded-full bg-white/10 backdrop-blur px-3 py-2 ring-1 ring-white/10 text-xs">
                  <span className="opacity-90">j/k or ↑/↓ to navigate</span>
                  <span aria-hidden className="opacity-50">
                    •
                  </span>
                  <span className="opacity-90">l like</span>
                  <span aria-hidden className="opacity-50">
                    •
                  </span>
                  <span className="opacity-90">s save</span>
                  <span aria-hidden className="opacity-50">
                    •
                  </span>
                  <span className="opacity-90">v visited</span>
                  <span aria-hidden className="opacity-50">
                    •
                  </span>
                  <span className="opacity-90">m mute</span>
                  <button
                    className="ml-auto p-1 rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    aria-label="Dismiss tips"
                    onClick={dismissTips}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-3 rounded-full bg-black/30 backdrop-blur px-2 py-2 ring-1 ring-white/10">
                {/* Like */}
                <button
                  aria-label={v.liked ? "Unlike" : "Like"}
                  title={v.liked ? "Unlike" : "Like"}
                  className={`px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2 ${likeMutation.isLoading ? "opacity-60" : ""}`}
                  onClick={() => onToggleLike(v)}
                  disabled={likeMutation.isLoading}
                >
                  <Heart className={v.liked ? "text-red-400" : ""} size={20} />
                  <span className="text-sm">{v.likes || 0}</span>
                </button>

                {/* Save */}
                <button
                  aria-label={v.favorited ? "Unsave" : "Save"}
                  title={v.favorited ? "Unsave" : "Save"}
                  className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2"
                  onClick={() => onToggleFavorite(v)}
                >
                  {v.favorited ? (
                    <BookmarkCheck size={20} />
                  ) : (
                    <Bookmark size={20} />
                  )}
                  <span className="text-sm">Save</span>
                </button>

                {/* Visited */}
                <button
                  aria-label={v.stamped ? "Visited" : "Mark visited"}
                  title={v.stamped ? "Visited" : "Mark visited"}
                  className={`px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2 ${v.stamped ? "opacity-80" : ""}`}
                  onClick={() => onVisited(v)}
                  disabled={stamping || v.stamped}
                >
                  <CheckCircle2 size={20} />
                  <span className="text-sm">
                    {v.stamped ? "Visited" : "Visited"}
                  </span>
                </button>

                {/* Share */}
                <button
                  aria-label="Share"
                  title="Share"
                  className="ml-auto px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2"
                  onClick={() => onShare(v)}
                >
                  <Share2 size={18} />
                  <span className="text-sm">Share</span>
                </button>

                {/* Mute toggle */}
                <button
                  aria-label={muted ? "Unmute" : "Mute"}
                  title={muted ? "Unmute" : "Mute"}
                  className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 flex items-center gap-2"
                  onClick={toggleMute}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span className="text-sm hidden sm:inline">
                    {muted ? "Muted" : "Sound"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
