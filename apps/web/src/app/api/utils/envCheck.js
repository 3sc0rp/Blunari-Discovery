// Simple runtime environment validation. Logs warnings; never throws.
// Use in server routes (e.g., /api/health) to surface missing production env configuration.

export default function validateEnv() {
  const required = [
    "APP_URL",
    "DATABASE_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `[env] Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const warnings = [];
  // APP_URL format sanity check in production
  try {
    const isProd =
      process.env.NODE_ENV === "production" || process.env.ENV === "production";
    const appUrl = process.env.APP_URL;
    if (isProd) {
      if (!appUrl) {
        warnings.push("APP_URL is not set in production");
      } else {
        try {
          const u = new URL(appUrl);
          if (u.protocol !== "https:") {
            warnings.push("APP_URL should use https in production");
          }
        } catch (e) {
          warnings.push("APP_URL is not a valid URL");
        }
      }
    }
  } catch {}

  if (warnings.length > 0) {
    console.warn(`[env] Warnings: ${warnings.join("; ")}`);
  }

  return { missing, warnings };
}
