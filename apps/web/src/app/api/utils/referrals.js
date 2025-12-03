import sql from "@/app/api/utils/sql";
import { addXp, recalculateBadgesForUser } from "@/app/api/utils/xp";
import { logEvent } from "@/app/api/utils/appEvents";

const REF_COOKIE_NAME = "blunari_ref";
const REF_COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

// Generate a short code (6-10 chars) and ensure uniqueness in referral_code
function generateShortCode() {
  const base = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return base.slice(0, 8);
}

export async function ensureReferralCodeForUser(userId) {
  if (!userId) return null;
  const existing = await sql(
    `SELECT code FROM referral_code WHERE referrer_user_id = $1 LIMIT 1`,
    [userId],
  );
  if (existing?.[0]?.code) return existing[0].code;

  // Try up to 5 times to avoid rare collisions
  for (let i = 0; i < 5; i++) {
    const code = generateShortCode();
    try {
      const rows = await sql(
        `INSERT INTO referral_code (code, referrer_user_id) VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING RETURNING code`,
        [code, userId],
      );
      if (rows?.[0]?.code) return rows[0].code;
    } catch (e) {
      console.error("ensureReferralCodeForUser insert error", e);
    }
  }
  // As a fallback, pick the first available code for user if any (race conditions)
  const latest = await sql(
    `SELECT code FROM referral_code WHERE referrer_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return latest?.[0]?.code || null;
}

export async function logReferralEvent({
  inviterUserId,
  eventType,
  referredUserId = null,
  metadata = {},
}) {
  try {
    await sql(
      `INSERT INTO referral_events (inviter_user_id, event_type, referred_user_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [inviterUserId, eventType, referredUserId, metadata],
    );
  } catch (e) {
    console.error("logReferralEvent error", e);
  }
}

export function buildReferralCookie(code) {
  const parts = [
    `${REF_COOKIE_NAME}=${encodeURIComponent(code)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];
  // Secure in production environments
  if (process.env.NODE_ENV !== "development") parts.push("Secure");
  parts.push(`Max-Age=${REF_COOKIE_MAX_AGE}`);
  return parts.join("; ");
}

export function clearReferralCookieHeader() {
  const parts = [`${REF_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`];
  if (process.env.NODE_ENV !== "development") {
    parts[0] += "; Secure";
  }
  return parts[0] + "; HttpOnly";
}

export function readReferralCookie(request) {
  const header = request.headers.get("cookie") || "";
  const cookies = header.split(/;\s*/);
  for (const c of cookies) {
    const [name, ...rest] = c.split("=");
    if (name === REF_COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

// On signup (or first authenticated /api/me call), check cookie and credit inviter once
export async function consumeReferralCookieAndCredit(request, newUserId) {
  try {
    const code = readReferralCookie(request);
    if (!code || !newUserId) return { credited: false, setCookie: null };

    // Lookup inviter by code
    const codeRows = await sql(
      `SELECT referrer_user_id AS inviter_id FROM referral_code WHERE code = $1 LIMIT 1`,
      [code],
    );
    const inviterId = codeRows?.[0]?.inviter_id || null;
    if (!inviterId) {
      return { credited: false, setCookie: clearReferralCookieHeader() };
    }
    if (String(inviterId) === String(newUserId)) {
      // Self referral ignored
      return { credited: false, setCookie: clearReferralCookieHeader() };
    }

    // Idempotent: only one claim per referee_user_id
    const inserted = await sql(
      `INSERT INTO referral_claim (code, referee_user_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM referral_claim WHERE referee_user_id = $2
       )
       RETURNING id`,
      [code, newUserId],
    );

    if (inserted?.[0]?.id) {
      // Credit inviter: increment signup count & +20 XP
      await sql(
        `UPDATE users SET referral_signup_count = referral_signup_count + 1, updated_at = now()
         WHERE id = $1`,
        [inviterId],
      );
      await addXp(inviterId, 20);
      await recalculateBadgesForUser(inviterId);
      await logReferralEvent({
        inviterUserId: inviterId,
        eventType: "signup",
        referredUserId: newUserId,
      });
      // Also log to app_events
      await logEvent({
        userId: String(newUserId),
        eventType: "referral_signup",
        entityId: String(inviterId),
        metadata: { referred_user_id: String(newUserId) },
      });
    }

    return {
      credited: !!inserted?.[0]?.id,
      setCookie: clearReferralCookieHeader(),
    };
  } catch (e) {
    console.error("consumeReferralCookieAndCredit error", e);
    return { credited: false, setCookie: clearReferralCookieHeader() };
  }
}

export async function getReferralStatsForUser(userId) {
  // clicks from events; signups from users.referral_signup_count
  const [codeRows, clickRows, signupCountRows] = await sql.transaction(
    (txn) => [
      txn(
        `SELECT code FROM referral_code WHERE referrer_user_id = $1 LIMIT 1`,
        [userId],
      ),
      txn(
        `SELECT COUNT(*)::int AS clicks FROM referral_events WHERE inviter_user_id = $1 AND event_type = 'click'`,
        [userId],
      ),
      txn(
        `SELECT referral_signup_count::int AS signups FROM users WHERE id = $1`,
        [userId],
      ),
    ],
  );
  const code = codeRows?.[0]?.code || null;
  const clicks = clickRows?.[0]?.clicks ?? 0;
  const signups = signupCountRows?.[0]?.signups ?? 0;
  return { code, clicks, signups };
}
