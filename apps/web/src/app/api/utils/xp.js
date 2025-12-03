import sql from "@/app/api/utils/sql";

// XP math: 100 XP per level
function computeLevelFromXp(xp) {
  const safeXp = Number.isFinite(xp) ? xp : 0;
  return Math.floor(safeXp / 100) + 1;
}

// Ensure a user_profile row exists and return the row
async function ensureUserProfile(userId) {
  await sql(
    "INSERT INTO user_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
    [userId],
  );
  const rows = await sql(
    "SELECT user_id, xp, level FROM user_profile WHERE user_id = $1",
    [userId],
  );
  return rows?.[0] || { user_id: userId, xp: 0, level: 1 };
}

// Add XP and recalc level, returning before/after and whether leveled up
export async function addXp(userId, amount) {
  if (!userId) throw new Error("addXp: userId required");
  const delta = Number(amount) || 0;
  if (delta === 0) {
    const current = await ensureUserProfile(userId);
    return {
      before: { xp: current.xp, level: current.level },
      after: { xp: current.xp, level: current.level },
      justLeveledUp: false,
    };
  }

  // Ensure row and then atomically update with level recompute
  const [_, beforeRows, afterRows] = await sql.transaction((txn) => [
    txn(
      "INSERT INTO user_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
      [userId],
    ),
    txn("SELECT xp, level FROM user_profile WHERE user_id = $1 FOR UPDATE", [
      userId,
    ]),
    txn(
      "UPDATE user_profile SET xp = xp + $2, level = floor((xp + $2) / 100) + 1, updated_at = now() WHERE user_id = $1 RETURNING xp, level",
      [userId, delta],
    ),
  ]);

  const before = beforeRows?.[0] || { xp: 0, level: 1 };
  const after = afterRows?.[0] || before;
  const justLeveledUp = (after.level ?? 1) > (before.level ?? 1);
  return { before, after, justLeveledUp };
}

// Upsert core badges used by the rules here, returns a map slug -> id
async function ensureCoreBadges() {
  // We use the existing `badge` table (slug unique, icon text, active boolean)
  const core = [
    {
      slug: "FIRST_STAMP",
      name: "First Stamp",
      description: "You marked your first restaurant as visited.",
      icon: "⭐",
    },
    {
      slug: "SUSHI_LOVER",
      name: "Sushi Lover",
      description: "Visited 2 sushi spots.",
      icon: "🍣",
    },
    {
      slug: "CITY_EXPLORER",
      name: "City Explorer",
      description: "Visited 5 restaurants across different cities.",
      icon: "🧭",
    },
  ];

  // Upsert all three
  for (const b of core) {
    await sql(
      `INSERT INTO badge (slug, name, description, icon, active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         icon = EXCLUDED.icon,
         active = true,
         updated_at = now()`,
      [b.slug, b.name, b.description, b.icon],
    );
  }

  const rows = await sql(
    "SELECT id, slug, name, description, icon FROM badge WHERE slug = ANY($1)",
    [["FIRST_STAMP", "SUSHI_LOVER", "CITY_EXPLORER"]],
  );
  const map = {};
  for (const r of rows || []) map[r.slug] = r;
  return map;
}

// Compute and award any new badges; returns list of newly earned badge objects
export async function recalculateBadgesForUser(userId) {
  if (!userId) throw new Error("recalculateBadgesForUser: userId required");
  const core = await ensureCoreBadges();

  // Stats needed for rules
  const [stampCountRows, sushiCountRows, cityCountRows] = await sql.transaction(
    (txn) => [
      txn(
        "SELECT COUNT(*)::int AS count FROM restaurant_stamps WHERE user_id = $1",
        [userId],
      ),
      txn(
        `SELECT COUNT(DISTINCT s.restaurant_id)::int AS count
         FROM restaurant_stamps s
         JOIN restaurant r ON r.id = s.restaurant_id
         WHERE s.user_id = $1 AND (r.tags && ARRAY['sushi']::text[])`,
        [userId],
      ),
      txn(
        `SELECT COUNT(DISTINCT c.city)::int AS count
         FROM restaurant_stamps s
         JOIN restaurant r ON r.id = s.restaurant_id
         JOIN city c ON c.id = r.city_id
         WHERE s.user_id = $1`,
        [userId],
      ),
    ],
  );

  const stamps = stampCountRows?.[0]?.count ?? 0;
  const sushi = sushiCountRows?.[0]?.count ?? 0;
  const distinctCities = cityCountRows?.[0]?.count ?? 0;

  const toAward = [];
  if (stamps >= 1 && core.FIRST_STAMP) toAward.push(core.FIRST_STAMP);
  if (sushi >= 2 && core.SUSHI_LOVER) toAward.push(core.SUSHI_LOVER);
  if (distinctCities >= 5 && core.CITY_EXPLORER)
    toAward.push(core.CITY_EXPLORER);

  const newly = [];
  for (const badge of toAward) {
    const inserted = await sql(
      `INSERT INTO user_badge (user_id, badge_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM user_badge ub WHERE ub.user_id = $1 AND ub.badge_id = $2
       )
       RETURNING badge_id`,
      [userId, badge.id],
    );
    if (inserted?.[0]) newly.push(badge);
  }

  return newly; // array of { id, slug, name, description, icon }
}

// Helper to be called after creating a first-time stamp
// Returns: { xp, level, justLeveledUp, newlyEarnedBadges }
export async function applyStampRewards(userId, restaurantId) {
  // +10 XP
  const { before, after, justLeveledUp } = await addXp(userId, 10);
  // Recalc badges
  const newlyEarnedBadges = await recalculateBadgesForUser(userId);
  return {
    xp: after.xp,
    level: after.level,
    justLeveledUp,
    newlyEarnedBadges,
  };
}

// Backwards-compatible stub (kept for existing call sites)
export async function awardXpForStamp(userId, restaurantId) {
  return applyStampRewards(userId, restaurantId);
}
