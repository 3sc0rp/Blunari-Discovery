import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";
import {
  ensureReferralCodeForUser,
  getReferralStatsForUser,
} from "@/app/api/utils/referrals";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user || null;
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Ensure the user has a referral code
    const code = await ensureReferralCodeForUser(String(user.id));
    const stats = await getReferralStatsForUser(String(user.id));

    const appUrl = process.env.APP_URL || "";
    const inviteUrl = code
      ? `${appUrl?.replace(/\/$/, "")}/invite/${code}`
      : null;

    return new Response(
      JSON.stringify({
        code,
        inviteUrl,
        clicks: stats.clicks,
        signups: stats.signups,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/referrals/me error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
