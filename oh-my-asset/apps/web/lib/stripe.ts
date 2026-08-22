/**
 * The two Stripe calls this product needs, over `fetch`.
 *
 * WHY NOT THE SDK
 *
 * The `stripe` package is excellent and unnecessary here. This app makes
 * exactly one API call (create a Checkout Session) and verifies one signature.
 * Both are short, stable, documented parts of Stripe's HTTP surface, and
 * writing them out means the payment path has no dependency that can go
 * unpatched between the day it is written and the day someone first pays.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * No customer records, no subscriptions, no saved cards. The product sells one
 * thing once, for ¥100, and every mechanism for selling it repeatedly is a
 * mechanism for getting a refund request wrong.
 */

const API = "https://api.stripe.com/v1";

/** Configured only when a real key is present, so nothing half-wired can run. */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required to take payments.");
  return key;
}

/**
 * Start a one-time purchase and return the URL to send the buyer to.
 *
 * `client_reference_id` carries the Supabase user id through Stripe and back
 * out on the webhook. It is the whole of the linkage between a payment and an
 * account, which is why the webhook refuses any event without it rather than
 * guessing from the email address — two people may share a mailbox, and a
 * guess here grants the product to the wrong account.
 *
 * `idempotency_key` is scoped to the user, so a double-clicked button reuses
 * one session instead of opening two.
 */
export async function createCheckoutSession(opts: {
  userId: string;
  email: string | null;
  successUrl: string;
  cancelUrl: string;
  locale: "ja" | "en";
}): Promise<string> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID!,
    "line_items[0][quantity]": "1",
    client_reference_id: opts.userId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    locale: opts.locale,
    // Surfaces in the Stripe dashboard and on the receipt, so a support
    // question can be answered without a database lookup.
    "metadata[user_id]": opts.userId,
  });
  if (opts.email) body.set("customer_email", opts.email);

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `unlimited:${opts.userId}`,
    },
    body,
  });

  const json = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) {
    throw new Error(json.error?.message ?? `Stripe returned ${res.status}`);
  }
  return json.url;
}

/**
 * Verify a webhook signature.
 *
 * Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 under the endpoint
 * secret and sends it as `Stripe-Signature: t=…,v1=…`. Everything below is
 * that sentence, plus two refusals that matter:
 *
 *  - the RAW body is hashed, never a re-serialised object. `JSON.parse` then
 *    `JSON.stringify` changes key order and whitespace and produces a
 *    different digest, so the caller must hand us the exact bytes.
 *  - a signature older than the tolerance is rejected even when it verifies,
 *    because a valid old event replayed forever is a valid old event.
 *
 * Returns the parsed event, or null. A caller that treats null as "ignore"
 * rather than "retry" is doing the right thing: an unsigned request is not a
 * delivery failure, it is somebody else.
 */
const TOLERANCE_SECONDS = 300;

export async function verifyWebhook(
  rawBody: string,
  header: string | null,
): Promise<Record<string, unknown> | null> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "t") timestamp = v ?? "";
    else if (k?.trim() === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return null;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!signatures.some((sig) => timingSafeEqual(sig, expected))) return null;

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Constant-time string comparison.
 *
 * `a === b` on a hex digest leaks, through how long it takes to fail, how many
 * leading characters were right — which is enough to reconstruct a valid
 * signature one character at a time. The loop below always reads every
 * character of the expected value.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
