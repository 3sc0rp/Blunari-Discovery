import { getMe } from "@/app/api/utils/user";
import { consumeReferralCookieAndCredit } from "@/app/api/utils/referrals";
import { logSignupOnce } from "@/app/api/utils/appEvents";

export async function GET(request) {
  try {
    const data = await getMe();
    let headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    };
    // If a referral cookie is present and user just signed up, credit inviter and clear cookie
    const userId = data?.user?.id || null;
    if (userId) {
      // Log signup exactly once per user (first authenticated call)
      await logSignupOnce(String(userId));
      const { setCookie } = await consumeReferralCookieAndCredit(
        request,
        String(userId),
      );
      if (setCookie) {
        headers = { ...headers, "Set-Cookie": setCookie };
      }
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("GET /api/me error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
