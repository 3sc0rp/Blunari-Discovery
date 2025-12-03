// Simple in-memory rate limiter (per runtime instance). Suitable for basic protection.
// Keyed by IP or user id + route.
const buckets = new Map();

function now() {
  return Date.now();
}

export function getClientKey(request) {
  // Prefer authenticated user id if available elsewhere; fallback to IP
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "ip:unknown";
  return ip.split(",")[0].trim();
}

export function rateLimit({ key, limit = 20, windowMs = 60_000 }) {
  const ts = now();
  const cutoff = ts - windowMs;
  const arr = buckets.get(key) || [];
  const recent = arr.filter((t) => t > cutoff);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return { ok: false, remaining: 0, resetInMs: recent[0] - cutoff };
  }
  recent.push(ts);
  buckets.set(key, recent);
  return {
    ok: true,
    remaining: Math.max(0, limit - recent.length),
    resetInMs: windowMs,
  };
}
