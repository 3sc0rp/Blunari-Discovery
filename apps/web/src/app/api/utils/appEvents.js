import sql from "@/app/api/utils/sql";

/**
 * Lightweight analytics logger. Never throws.
 * @param {Object} params
 * @param {string=} params.userId
 * @param {('signup'|'passport_stamp'|'trail_complete'|'drop_claim'|'referral_click'|'referral_signup')} params.eventType
 * @param {string=} params.source - e.g. 'checkin' | 'drop' | 'manual'
 * @param {string|number=} params.entityId - related entity id (stored as text)
 * @param {Object=} params.metadata - arbitrary JSON
 */
export async function logEvent({
  userId = null,
  eventType,
  source = null,
  entityId = null,
  metadata = null,
}) {
  try {
    const entityText = entityId == null ? null : String(entityId);
    const meta = metadata ? JSON.stringify(metadata) : null;
    await sql(
      `INSERT INTO app_events (user_id, event_type, source, entity_id, metadata)
       VALUES ($1, $2::app_event_type, $3, $4, $5::jsonb)`,
      [userId, eventType, source, entityText, meta],
    );
    if (process.env.ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[app_events]", {
        userId,
        eventType,
        source,
        entityId: entityText,
        metadata,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("logEvent failed", e?.message || e);
  }
}

/**
 * Log signup exactly once per user. Uses a NOT EXISTS guard to avoid duplicates.
 */
export async function logSignupOnce(userId) {
  try {
    await sql(
      `INSERT INTO app_events (user_id, event_type)
       SELECT $1, 'signup'::app_event_type
       WHERE NOT EXISTS (
         SELECT 1 FROM app_events WHERE user_id = $1 AND event_type = 'signup'::app_event_type
       )`,
      [userId],
    );
    if (process.env.ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[app_events] signup (once)", { userId });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("logSignupOnce failed", e?.message || e);
  }
}
