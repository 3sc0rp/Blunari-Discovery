import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function FiltersBar({
  keyword,
  setKeyword,
  selected,
  setSelected,
  all,
  onClear,
}) {
  const theme = useTheme();

  const hasAny = useMemo(() => {
    return (
      !!keyword ||
      selected.cuisines.length > 0 ||
      !!selected.price ||
      !!selected.neighborhood ||
      selected.tags.length > 0
    );
  }, [keyword, selected]);

  // popover state
  const [open, setOpen] = useState(null); // 'cuisines' | 'neighborhood' | 'tags' | 'price' | null

  // temp selections (apply inside popover)
  const [tempCuisines, setTempCuisines] = useState(selected.cuisines);
  const [tempNeighborhood, setTempNeighborhood] = useState(
    selected.neighborhood,
  );
  const [tempTags, setTempTags] = useState(selected.tags);
  const [tempPrice, setTempPrice] = useState(selected.price);

  // local searches within popovers
  const [searchCuisine, setSearchCuisine] = useState("");
  const [searchNeighborhood, setSearchNeighborhood] = useState("");
  const [searchTag, setSearchTag] = useState("");

  // refs for closing on outside click
  const popoverRefs = {
    cuisines: useRef(null),
    neighborhood: useRef(null),
    tags: useRef(null),
    price: useRef(null),
  };

  const focusRefs = {
    cuisines: useRef(null),
    neighborhood: useRef(null),
    tags: useRef(null),
    price: useRef(null),
  };

  useEffect(() => {
    // sync temps whenever selected changes externally
    setTempCuisines(selected.cuisines);
    setTempNeighborhood(selected.neighborhood);
    setTempTags(selected.tags);
    setTempPrice(selected.price);
  }, [selected]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(null);
      if (
        e.key === "/" &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        // focus the keyword search quickly
        const input = document.getElementById("restaurants-keyword");
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    }
    function onClick(e) {
      if (!open) return;
      const ref = popoverRefs[open];
      if (ref && ref.current && !ref.current.contains(e.target)) {
        setOpen(null);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick); // fix: correctly remove mousedown
    };
  }, [open]);

  useEffect(() => {
    if (open && focusRefs[open]?.current) {
      focusRefs[open].current.focus();
    }
  }, [open]);

  const apply = useCallback(
    (group) => {
      if (group === "cuisines") {
        setSelected((s) => ({ ...s, cuisines: tempCuisines }));
      } else if (group === "neighborhood") {
        setSelected((s) => ({ ...s, neighborhood: tempNeighborhood }));
      } else if (group === "tags") {
        setSelected((s) => ({ ...s, tags: tempTags }));
      } else if (group === "price") {
        setSelected((s) => ({ ...s, price: tempPrice }));
      }
      setOpen(null);
    },
    [tempCuisines, tempNeighborhood, tempTags, tempPrice, setSelected],
  );

  const clearGroup = useCallback(
    (group) => {
      if (group === "cuisines") {
        setTempCuisines([]);
        setSelected((s) => ({ ...s, cuisines: [] }));
      } else if (group === "neighborhood") {
        setTempNeighborhood("");
        setSelected((s) => ({ ...s, neighborhood: "" }));
      } else if (group === "tags") {
        setTempTags([]);
        setSelected((s) => ({ ...s, tags: [] }));
      } else if (group === "price") {
        setTempPrice("");
        setSelected((s) => ({ ...s, price: "" }));
      }
      setOpen(null);
    },
    [setSelected],
  );

  const filteredCuisines = useMemo(() => {
    const q = searchCuisine.toLowerCase();
    return all.cuisines.filter((c) => c.toLowerCase().includes(q));
  }, [all.cuisines, searchCuisine]);

  const filteredNeighborhoods = useMemo(() => {
    const q = searchNeighborhood.toLowerCase();
    return all.neighborhoods.filter((n) => n.toLowerCase().includes(q));
  }, [all.neighborhoods, searchNeighborhood]);

  const filteredTags = useMemo(() => {
    const q = searchTag.toLowerCase();
    return all.tags.filter((t) => t.toLowerCase().includes(q));
  }, [all.tags, searchTag]);

  const Chip = ({ id, label, count, active, onClick }) => (
    <button
      id={id}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open === id}
      aria-controls={`${id}-panel`}
      className={`text-xs px-3 py-2 rounded-full border inline-flex items-center gap-1 ${active ? "border-white/60 bg-white/10" : `${theme.bg.border} ${theme.bg.overlay}`} ${theme.hover.bg} focus:outline-none ${theme.brand.ring}`}
    >
      <span>{label}</span>
      {count ? (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${theme.bg.overlay} border ${theme.bg.border}`}
        >
          {count}
        </span>
      ) : null}
      <ChevronDown size={14} className={theme.text.muted} />
    </button>
  );

  const Panel = ({
    id,
    title,
    children,
    actions,
    widthClass = "w-[min(90vw,360px)]",
  }) => (
    <div
      ref={popoverRefs[id]}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}`}
      id={`${id}-panel`}
      className={`absolute z-50 mt-2 ${widthClass} rounded-xl ${theme.bg.overlay} border ${theme.bg.border} ring-1 ring-white/5 p-3 shadow-xl`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 className="text-sm font-medium">{title}</h3>
        <button
          onClick={() => setOpen(null)}
          className={`text-xs px-2 py-1 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
          aria-label="Close"
        >
          Close
        </button>
      </div>
      <div className="pt-3 max-h-[50vh] overflow-auto">{children}</div>
      {actions ? (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10 mt-3 sticky bottom-0 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/30 rounded-b-xl">
          {actions}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={`sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 ${theme.text.primary} px-4 sm:px-6 pt-4 pb-3 border-b ${theme.bg.border}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3 relative">
        {/* Keyword */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 w-full ${theme.bg.overlay} border ${theme.bg.border} ring-1 ring-white/5 focus-within:ring-white/20`}
          >
            <Search size={16} className={theme.text.muted} />
            <input
              id="restaurants-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, dish, or vibe..."
              className={`bg-transparent outline-none w-full text-sm ${theme.text.primary}`}
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                aria-label="Clear search"
                className={`${theme.text.muted} ${theme.hover.text}`}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {hasAny && (
            <button
              onClick={onClear}
              className={`text-xs rounded-lg px-3 py-2 border ${theme.bg.border} ${theme.hover.bg}`}
            >
              Clear
            </button>
          )}
        </div>

        {/* Popover filter chips - luxury, modern, no horizontal scroll */}
        <div className="flex flex-wrap items-center gap-2 relative">
          {/* Cuisines chip */}
          <div className="relative">
            <Chip
              id="cuisines"
              label="Cuisines"
              count={selected.cuisines.length || null}
              active={open === "cuisines" || selected.cuisines.length > 0}
              onClick={() =>
                setOpen((o) => (o === "cuisines" ? null : "cuisines"))
              }
            />
            {open === "cuisines" && (
              <Panel
                id="cuisines"
                title="Select cuisines"
                actions={
                  <>
                    <button
                      onClick={() => clearGroup("cuisines")}
                      className={`text-xs px-3 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => apply("cuisines")}
                      className={`text-xs px-3 py-2 rounded-md ${theme.brand.subtleRing} border ${theme.bg.border} bg-white/10`}
                    >
                      Apply
                    </button>
                  </>
                }
              >
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 mb-3 border ${theme.bg.border} ${theme.bg.overlay}`}
                >
                  <Search size={14} className={theme.text.muted} />
                  <input
                    ref={focusRefs.cuisines}
                    value={searchCuisine}
                    onChange={(e) => setSearchCuisine(e.target.value)}
                    placeholder="Search cuisines"
                    className={`bg-transparent outline-none w-full text-sm ${theme.text.primary}`}
                  />
                </div>
                <ul className="space-y-1">
                  {filteredCuisines.map((c) => {
                    const checked = tempCuisines.includes(c);
                    return (
                      <li key={c}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-[#0EA5FF]"
                            checked={checked}
                            onChange={() =>
                              setTempCuisines((prev) =>
                                prev.includes(c)
                                  ? prev.filter((x) => x !== c)
                                  : [...prev, c],
                              )
                            }
                          />
                          <span>{c}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </div>

          {/* Neighborhood chip */}
          <div className="relative">
            <Chip
              id="neighborhood"
              label="Neighborhood"
              count={selected.neighborhood ? 1 : null}
              active={open === "neighborhood" || !!selected.neighborhood}
              onClick={() =>
                setOpen((o) => (o === "neighborhood" ? null : "neighborhood"))
              }
            />
            {open === "neighborhood" && (
              <Panel
                id="neighborhood"
                title="Select neighborhood"
                actions={
                  <>
                    <button
                      onClick={() => clearGroup("neighborhood")}
                      className={`text-xs px-3 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => apply("neighborhood")}
                      className={`text-xs px-3 py-2 rounded-md ${theme.brand.subtleRing} border ${theme.bg.border} bg-white/10`}
                    >
                      Apply
                    </button>
                  </>
                }
              >
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 mb-3 border ${theme.bg.border} ${theme.bg.overlay}`}
                >
                  <Search size={14} className={theme.text.muted} />
                  <input
                    ref={focusRefs.neighborhood}
                    value={searchNeighborhood}
                    onChange={(e) => setSearchNeighborhood(e.target.value)}
                    placeholder="Search neighborhoods"
                    className={`bg-transparent outline-none w-full text-sm ${theme.text.primary}`}
                  />
                </div>
                <ul className="space-y-1">
                  {filteredNeighborhoods.map((n) => (
                    <li key={n}>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="neighborhood"
                          className="accent-[#0EA5FF]"
                          checked={tempNeighborhood === n}
                          onChange={() => setTempNeighborhood(n)}
                        />
                        <span>{n}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {/* Tags chip */}
          <div className="relative">
            <Chip
              id="tags"
              label="Tags"
              count={selected.tags.length || null}
              active={open === "tags" || selected.tags.length > 0}
              onClick={() => setOpen((o) => (o === "tags" ? null : "tags"))}
            />
            {open === "tags" && (
              <Panel
                id="tags"
                title="Select tags"
                actions={
                  <>
                    <button
                      onClick={() => clearGroup("tags")}
                      className={`text-xs px-3 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => apply("tags")}
                      className={`text-xs px-3 py-2 rounded-md ${theme.brand.subtleRing} border ${theme.bg.border} bg-white/10`}
                    >
                      Apply
                    </button>
                  </>
                }
              >
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 mb-3 border ${theme.bg.border} ${theme.bg.overlay}`}
                >
                  <Search size={14} className={theme.text.muted} />
                  <input
                    ref={focusRefs.tags}
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder="Search tags"
                    className={`bg-transparent outline-none w-full text-sm ${theme.text.primary}`}
                  />
                </div>
                <ul className="space-y-1">
                  {filteredTags.map((t) => {
                    const checked = tempTags.includes(t);
                    return (
                      <li key={t}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-[#0EA5FF]"
                            checked={checked}
                            onChange={() =>
                              setTempTags((prev) =>
                                prev.includes(t)
                                  ? prev.filter((x) => x !== t)
                                  : [...prev, t],
                              )
                            }
                          />
                          <span>{t}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </div>

          {/* Price chip */}
          <div className="relative">
            <Chip
              id="price"
              label="Price"
              count={selected.price ? 1 : null}
              active={open === "price" || !!selected.price}
              onClick={() => setOpen((o) => (o === "price" ? null : "price"))}
            />
            {open === "price" && (
              <Panel
                id="price"
                title="Select price"
                actions={
                  <>
                    <button
                      onClick={() => clearGroup("price")}
                      className={`text-xs px-3 py-2 rounded-md border ${theme.bg.border} ${theme.hover.bg}`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => apply("price")}
                      className={`text-xs px-3 py-2 rounded-md ${theme.brand.subtleRing} border ${theme.bg.border} bg-white/10`}
                    >
                      Apply
                    </button>
                  </>
                }
              >
                <div
                  className="grid grid-cols-4 gap-2"
                  ref={focusRefs.price}
                  tabIndex={-1}
                >
                  {["$", "$$", "$$$", "$$$$"].map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setTempPrice((prev) => (prev === p ? "" : p))
                      }
                      aria-pressed={tempPrice === p}
                      className={`text-sm px-2 py-2 rounded-md border ${tempPrice === p ? "border-white/60 bg-white/10" : `${theme.bg.border} ${theme.bg.overlay}`} ${theme.hover.bg}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
