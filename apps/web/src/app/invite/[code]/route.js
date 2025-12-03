import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import {
  buildReferralCookie,
  logReferralEvent,
} from "@/app/api/utils/referrals";
import { logEvent } from "@/app/api/utils/appEvents";

export async function GET(request, { params }) {
  try {
    const code = params?.code || "";
    if (!code) {
      return Response.redirect(`/account/signup`, 302);
    }

    const rows = await sql(
      `SELECT referrer_user_id AS inviter_id FROM referral_code WHERE code = $1 LIMIT 1`,
      [code],
    );
    const inviterId = rows?.[0]?.inviter_id || null;
    if (!inviterId) {
      // Invalid/unknown code → redirect gracefully
      return Response.redirect(`/account/signup`, 302);
    }

    // Log click for analytics
    const ua = request.headers.get("user-agent") || undefined;
    await logReferralEvent({
      inviterUserId: inviterId,
      eventType: "click",
      metadata: { ua },
    });
    // Also log to app_events (lightweight analytics)
    await logEvent({
      userId: null,
      eventType: "referral_click",
      entityId: inviterId,
      metadata: { code, ua },
    });

    // Set cookie with the invite code, 14 days
    const setCookie = buildReferralCookie(code);

    // Choose destination depending on auth
    const session = await auth();
    const isAuthed = !!session?.user?.id;
    const dest = isAuthed ? "/" : "/account/signup?callbackUrl=/";

    return new Response(null, {
      status: 302,
      headers: {
        Location: dest,
        "Set-Cookie": setCookie,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /invite/[code] error", err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/account/signup",
        "Cache-Control": "no-store",
      },
    });
  }
}
