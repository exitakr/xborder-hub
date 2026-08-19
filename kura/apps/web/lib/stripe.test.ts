import assert from "node:assert/strict";
import test from "node:test";
import { verifyWebhook } from "./stripe.ts";

/**
 * The webhook endpoint is the one URL on this site where an anonymous POST can
 * hand out the paid product. Everything it trusts comes from `verifyWebhook`,
 * so these tests are the boundary: each one is a way of getting the product for
 * nothing, and each must fail.
 */

const SECRET = "whsec_test_secret";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;

async function sign(body: string, timestamp: number, secret = SECRET): Promise<string> {
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
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

const BODY = JSON.stringify({
  type: "checkout.session.completed",
  data: { object: { payment_status: "paid", client_reference_id: "user-1" } },
});

test("accepts a correctly signed, current event", async () => {
  const now = Math.floor(Date.now() / 1000);
  const event = await verifyWebhook(BODY, await sign(BODY, now));
  assert.equal(event?.type, "checkout.session.completed");
});

test("rejects a body that changed after signing", async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = await sign(BODY, now);
  // The realistic attack: a genuine event, replayed with a different account
  // named as the beneficiary.
  const tampered = BODY.replace("user-1", "user-2");
  assert.equal(await verifyWebhook(tampered, header), null);
});

test("rejects a signature made with the wrong secret", async () => {
  const now = Math.floor(Date.now() / 1000);
  assert.equal(await verifyWebhook(BODY, await sign(BODY, now, "whsec_not_ours")), null);
});

test("rejects a valid signature that is too old to replay", async () => {
  // Correctly signed, and still refused: a captured delivery must not stay
  // usable indefinitely.
  const stale = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(await verifyWebhook(BODY, await sign(BODY, stale)), null);
});

test("rejects a missing or malformed signature header", async () => {
  assert.equal(await verifyWebhook(BODY, null), null);
  assert.equal(await verifyWebhook(BODY, "nonsense"), null);
  // A timestamp with no v1 digest at all.
  assert.equal(await verifyWebhook(BODY, `t=${Math.floor(Date.now() / 1000)}`), null);
});

test("accepts the real header shape, which carries several schemes", async () => {
  const now = Math.floor(Date.now() / 1000);
  const good = await sign(BODY, now);
  // Stripe sends v0 alongside v1 for endpoints in test mode; the v1 entry has
  // to be found among the others rather than assumed to be the only one.
  const header = `${good},v0=deadbeef`;
  assert.equal((await verifyWebhook(BODY, header))?.type, "checkout.session.completed");
});

test("rejects a signed body that is not JSON", async () => {
  const now = Math.floor(Date.now() / 1000);
  const body = "not json";
  assert.equal(await verifyWebhook(body, await sign(body, now)), null);
});

test("rejects everything when no endpoint secret is configured", async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = await sign(BODY, now);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  try {
    // Fails closed. An unconfigured deployment must grant nothing, rather than
    // treat "no secret" as "no check".
    assert.equal(await verifyWebhook(BODY, header), null);
  } finally {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  }
});
