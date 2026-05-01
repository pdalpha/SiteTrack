/**
 * Email sender for SiteTrack.
 *
 * Uses Resend (https://resend.com) in production — free tier: 3,000 emails/month.
 * Set RESEND_API_KEY in your Render environment variables.
 *
 * In dev (no API key), emails are logged to console instead of sent.
 */

const FROM = "SiteTrack <support@sitetrack.site>";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n[EMAIL DEV MODE — RESEND_API_KEY not set]");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body preview:", text.slice(0, 300));
    console.log("[Set RESEND_API_KEY in Render dashboard to send real emails.]\n");
    return { id: "dev-mode" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }

  return res.json();
}
