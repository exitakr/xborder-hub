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
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_YEARLY),
  );
}

export type BillingInterval = "month" | "year";

export function priceIdFor(interval: BillingInterval): string | null {
  const id =
    interval === "year" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  return id?.trim() || null;
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
  customerId: string | null;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  locale: "ja" | "en";
}): Promise<string> {
  const price = priceIdFor(opts.interval);
  if (!price) throw new Error(`No Stripe price configured for ${opts.interval}.`);

  const body = new URLSearchParams({
    // A subscription, not a payment. The difference is the whole point: a
    // one-time charge produces revenue that already happened, a subscription
    // produces a run rate that can be discounted and capitalised.
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    client_reference_id: opts.userId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    locale: opts.locale,
    "metadata[user_id]": opts.userId,
    // Carried onto the subscription object itself, because the webhook events
    // that matter later (renewals, cancellations) arrive as subscription
    // events and never see the checkout session's metadata.
    "subscription_data[metadata][user_id]": opts.userId,
  });

  // Reusing the customer keeps one person's payment history in one place, which
  // is what makes the revenue ledger reconcilable against Stripe later.
  if (opts.customerId) body.set("customer", opts.customerId);
  else if (opts.email) body.set("customer_email", opts.email);

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Scoped to the interval too: someone who opens monthly, backs out and
      // then chooses annual must not be handed the monthly session again.
      "Idempotency-Key": `sub:${opts.userId}:${opts.interval}`,
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
 * A link to Stripe's own billing portal.
 *
 * This is how a subscriber cancels, changes card or downloads a receipt. It is
 * not a convenience: Article 11 of the Specified Commercial Transactions Act,
 * as amended in 2022 for recurring purchases, requires that cancelling be no
 * harder than subscribing. A cancellation flow that runs through a contact
 * form and a human is exactly the pattern the amendment exists to stop.
 */
export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
  locale: "ja" | "en";
}): Promise<string> {
  const body = new URLSearchParams({
    customer: opts.customerId,
    return_url: opts.returnUrl,
    locale: opts.locale,
  });

  const res = await fetch(`${API}/billing_portal/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
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
 * Read one object back from Stripe.
 *
 * Webhook payloads are not always enough on their own: an `invoice.paid` names
 * a subscription but does not carry its period end, and acting on a stale or
 * partial payload is how an entitlement ends up with the wrong expiry. Fetching
 * the object costs one request and removes the guesswork.
 */
export async function retrieve<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
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
