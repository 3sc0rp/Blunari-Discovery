import { useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    try {
      const mq =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      if (mq) setIsDark(mq.matches);
      const handler = (e) => setIsDark(e.matches);
      mq?.addEventListener?.("change", handler);
      return () => mq?.removeEventListener?.("change", handler);
    } catch (e) {
      // SSR-safe: window not available
    }
  }, []);

  // Brand palette tuned to the provided logo (oceanic blue → deep indigo)
  const brandRingDark =
    "focus:ring-2 focus:ring-[#38BDF8]/40 focus:ring-offset-2 focus:ring-offset-black";
  const brandRingLight =
    "focus:ring-2 focus:ring-[#38BDF8]/40 focus:ring-offset-2 focus:ring-offset-white";
  const brandSubtleRing = "ring-1 ring-[#38BDF8]/20";

  return {
    isDark,
    // Deeper, premium dark with a subtle blue cast to match the logo
    background: isDark
      ? `radial-gradient(80% 60% at 20% 0%, rgba(14,165,255,0.10) 0%, rgba(9,13,26,0.6) 35%, #060A14 100%), linear-gradient(#070A12, #050811)`
      : "radial-gradient(#F8F9FA 0%, #E9ECEF 40%, #DEE2E6 100%)",
    text: {
      primary: isDark ? "text-white/90" : "text-gray-900/85",
      secondary: isDark ? "text-white/70" : "text-gray-700/70",
      muted: isDark ? "text-white/60" : "text-gray-600/60",
      faint: isDark ? "text-white/40" : "text-gray-400/60",
      decoration: isDark ? "text-white/15" : "text-gray-900/10",
    },
    bg: {
      overlay: isDark ? "bg-white/5" : "bg-black/5",
      overlayHover: isDark ? "bg-white/10" : "bg-black/10",
      border: isDark ? "border-white/10" : "border-gray-200",
      borderHover: isDark ? "border-white/20" : "border-gray-300",
      // Premium accent: gradient button background that matches the logo
      accent: isDark
        ? "bg-gradient-to-r from-[#0EA5FF] to-[#2563EB]"
        : "bg-gradient-to-r from-[#2563EB] to-[#0EA5FF]",
      accentText: "text-white",
    },
    hover: {
      text: isDark ? "hover:text-white" : "hover:text-gray-900",
      bg: isDark ? "hover:bg-white/10" : "hover:bg-black/5",
    },
    brand: {
      // Convenient shortcuts for brand usage in classes (static for Tailwind)
      gradient: "bg-gradient-to-r from-[#0EA5FF] to-[#2563EB]",
      textGradient:
        "bg-clip-text text-transparent bg-gradient-to-r from-[#0EA5FF] to-[#2563EB]",
      ring: isDark ? brandRingDark : brandRingLight,
      subtleRing: brandSubtleRing,
    },
  };
}
