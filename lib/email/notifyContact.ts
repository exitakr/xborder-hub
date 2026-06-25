import "server-only";

const CATEGORY_LABELS: Record<string, string> = {
  general: "一般的なご質問・ご要望",
  account: "アカウント削除・データ修正",
  report: "不適切な投稿の通報",
  business: "取材・協業のご相談",
  bug: "不具合の報告",
};

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

/**
 * Best-effort notification email sent via Resend whenever a contact form is
 * submitted. The contact_submissions row (migration 0008) is the source of
 * truth — a failure here is logged but never blocks the user-facing
 * submission, since the row is already persisted by the caller.
 *
 * Requires RESEND_API_KEY in the environment. No-ops (with a console
 * warning) if it's missing, so local/dev setups without Resend still work.
 */
export async function notifyContactSubmission(input: {
  category: string;
  subject: string;
  body: string;
  email: string;
  name: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[contact] RESEND_API_KEY not set — skipping notification email",
    );
    return;
  }

  const to = process.env.CONTACT_NOTIFY_EMAIL ?? "contact@xbordercareer.com";
  const categoryLabel = CATEGORY_LABELS[input.category] ?? input.category;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "X Border Hub <noreply@xbordercareer.com>",
        to: [to],
        reply_to: input.email,
        subject: `【お問い合わせ】${categoryLabel}: ${input.subject}`,
        html: `
          <p><strong>種別:</strong> ${escapeHtml(categoryLabel)}</p>
          <p><strong>送信者:</strong> ${escapeHtml(input.name ?? "(未入力)")} (${escapeHtml(input.email)})</p>
          <p><strong>件名:</strong> ${escapeHtml(input.subject)}</p>
          <p><strong>本文:</strong></p>
          <p>${escapeHtml(input.body).replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!res.ok) {
      console.error(
        "[contact] notifyContactSubmission failed",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.error("[contact] notifyContactSubmission (catch)", err);
  }
}
