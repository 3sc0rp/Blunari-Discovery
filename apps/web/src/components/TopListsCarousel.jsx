import { motion } from "motion/react";
import { useTheme } from "../hooks/useTheme";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TopListsCarousel({ lists }) {
  const theme = useTheme();
  const scrollerRef = useRef(null);

  const scrollBy = (dx) => {
    try {
      scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
    } catch (e) {
      scrollerRef.current && (scrollerRef.current.scrollLeft += dx);
    }
  };

  return (
    <div className="relative" aria-roledescription="carousel">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
        role="list"
        aria-label="Top lists"
      >
        {lists.map((l) => {
          const spots =
            l.items_count ??
            (Array.isArray(l.items) ? l.items.length : undefined);
          return (
            <motion.a
              key={l.slug}
              href={`/lists/${l.slug}`}
              whileHover={{ y: -2 }}
              className={`min-w-[260px] sm:min-w-[300px] md:min-w-[360px] rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} hover:${theme.bg.borderHover} p-5 flex-shrink-0 ring-1 ring-white/5 focus:outline-none ${theme.brand.ring}`}
              style={{ scrollSnapAlign: "start" }}
              role="listitem"
              tabIndex={0}
              aria-label={`${l.title}${spots ? `, ${spots} restaurants` : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{l.title}</h3>
                {typeof spots === "number" ? (
                  <span className="text-xs opacity-60">{spots} spots</span>
                ) : null}
              </div>
              {l.description ? (
                <p className={`mt-2 text-sm ${theme.text.muted}`}>
                  {l.description}
                </p>
              ) : null}
              <div className="mt-4 text-sm underline opacity-80">View list</div>
            </motion.a>
          );
        })}
      </div>

      {/* Nav buttons for keyboard and hover users */}
      <div className="hidden sm:flex absolute inset-y-0 right-0 items-center gap-2 pr-1">
        <button
          onClick={() => scrollBy(-320)}
          className={`p-2 rounded-full ${theme.bg.overlay} border ${theme.bg.border} ${theme.brand.ring}`}
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scrollBy(320)}
          className={`p-2 rounded-full ${theme.bg.overlay} border ${theme.bg.border} ${theme.brand.ring}`}
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
