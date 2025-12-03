import { Heart, MapPin } from "lucide-react";
import { motion } from "motion/react";
import useFavorites from "../utils/useFavorites";
import { useTheme } from "../hooks/useTheme";
import { toast } from "sonner"; // toast for feedback with undo

export default function RestaurantCard({ restaurant, country, city }) {
  const { isFavorite, toggle } = useFavorites();
  const theme = useTheme();
  const fav = isFavorite(restaurant.slug);

  const cuisines = restaurant.cuisines.join(" · ");

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    const wasFav = isFavorite(restaurant.slug);
    const payload =
      country && city ? { ...restaurant, country, city } : restaurant;
    toggle(payload);
    // optimistic toast with undo
    toast[wasFav ? "info" : "success"](
      wasFav ? "Removed from Favorites" : "Added to Favorites",
      {
        description: restaurant.name,
        action: {
          label: "Undo",
          onClick: () => toggle(payload),
        },
      },
    );
  };

  const href =
    country && city
      ? `/${country}/${city}/restaurants/${restaurant.slug}`
      : `/restaurants/${restaurant.slug}`;

  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative block overflow-hidden rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} hover:${theme.bg.borderHover} transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40`}
      aria-label={`View ${restaurant.name}`}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={restaurant.images?.[0]}
          alt={`${restaurant.name} photo`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Subtle gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        {/* Score badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-white/10 backdrop-blur ring-1 ring-white/20 shadow-sm">
            {restaurant.score}
          </span>
        </div>
        {/* Neighborhood */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs bg-black/40 backdrop-blur px-2 py-1 rounded-md ring-1 ring-white/20">
          <MapPin size={14} />
          <span>{restaurant.neighborhood}</span>
        </div>
        {/* Favorite */}
        <motion.button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          whileTap={{ scale: 0.9 }}
          animate={{ scale: fav ? 1.1 : 1, rotate: fav ? 8 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition text-white ring-1 ring-white/20 ${fav ? "text-red-400" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40`}
        >
          <Heart size={16} fill={fav ? "currentColor" : "transparent"} />
        </motion.button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-base sm:text-lg truncate">
            {restaurant.name}
          </h3>
          <span className="text-xs opacity-70">{restaurant.price}</span>
        </div>
        <p className="text-xs opacity-70 mt-1 truncate">{cuisines}</p>
        <p className="text-sm opacity-80 mt-2 line-clamp-2">
          {restaurant.tagline}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(restaurant.tags || []).slice(0, 3).map((t) => (
            <span
              key={t}
              className={`text-[11px] px-2 py-1 rounded-full ${theme.bg.overlayHover} ring-1 ring-white/10`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.a>
  );
}
