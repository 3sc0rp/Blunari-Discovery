// Removed hardcoded mock city list. Use /api/cities for real data.
export const cities = [];

export function formatCityDisplay(country, city) {
  // Without local data, return a readable fallback
  if (!country || !city) return null;
  return `${city}, ${String(country).toUpperCase()}`;
}

export function normalizeCityFromPath(pathname) {
  // Parse /:country/:city/...; returns { country, city } or null
  if (!pathname || typeof pathname !== "string") return null;
  const parts = pathname.replace(/^\/+/, "").split("/");
  if (parts.length >= 2) {
    const [country, city] = parts;
    if (country && city) return { country, city };
  }
  return null;
}
