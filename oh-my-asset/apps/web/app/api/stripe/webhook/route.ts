import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook } from "@/lib/stripe";

/**
 * Where a payment becomes an entitlement.
 *
 * This is the only place in the app that grants the paid product, and it is
 * reachable by anyone on the internet, so it is written to be boring:
 *
 *  1. verify the signature against the RAW body — the request is otherwise
 *     just a POST claiming to be from Stripe;
 *  2. act only on the two events that mean something here;
 *  3. carry the Supabase user id from `client_reference_id`, never from the
 *     email address, and refuse the event if it is missing;
 *  4. let `grant_unlimited` de-duplicate on the receipt id, because Stripe
 *     retries deliveries and will send this event again.
 *
 * It always answers 200 once the signature checks out, including when there is
 * nothing to do. A non-2xx tells Stripe to retry, and retrying an event we
 * have decided to ignore just produces the same decision hourly for three
 * days.
 */

// The signature covers the exact bytes Stripe sent, so this route must read
// the body as text and must never be cached or statically analysed away.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  const event = await verifyWebhook(raw, request.headers.get("stripe-signature"));

  if (!event) {
    // Deliberately terse. An unsigned caller learns nothing about why.
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const type = event.type as string;
  const object = (event.data as { object?: Record<string, unknown> } | undefined)?.object ?? {};

  try {
    if (type === "checkout.session.completed") {
      // `payment_status` matters: a session can complete with payment still
      // pending (bank transfer, konbini). Granting on the wrong one hands out
      // the product before the money exists.
      if (object.payment_status !== "paid") {
        return NextResponse.json({ ok: true, ignored: "unpaid" });
      }

      const userId = object.client_reference_id as string | null;
      if (!userId) {
        console.error("[stripe] checkout.session.completed without client_reference_id");
        return NextResponse.json({ ok: true, ignored: "no user" });
      }

      const supabase = createAdminClient();
      const { error } = await supabase.rpc("grant_unlimited", {
        p_user: userId,
        p_provider: "stripe",
        p_receipt: (object.payment_intent as string | null) ?? (object.id as string),
        p_expires: null,
        p_note: null,
      });
      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true, granted: true });
    }

    /*
     * A refund or a chargeback takes the product back.
     *
     * Without this, the cheapest way to get unlimited registrations forever is
     * to pay ¥100 and then dispute it. The receipt id written above is what
     * lets us find the account again — the charge carries the payment intent,
     * which is exactly what was stored.
     */
    if (type === "charge.refunded" || type === "charge.dispute.created") {
      const intent =
        (object.payment_intent as string | null) ??
        ((object.charge as string | null) ?? null);
      if (!intent) return NextResponse.json({ ok: true, ignored: "no intent" });

      const supabase = createAdminClient();
      const { data } = await supabase
        .from("entitlements")
        .select("user_id")
        .eq("receipt_id", intent)
        .maybeSingle();

      if (data?.user_id) {
        const { error } = await supabase.rpc("revoke_unlimited", { p_user: data.user_id });
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true, revoked: true });
      }
      return NextResponse.json({ ok: true, ignored: "unknown receipt" });
    }

    return NextResponse.json({ ok: true, ignored: type });
  } catch (err) {
    // A 500 here IS worth a retry: the signature was good and the event is
    // real, so the failure is ours and Stripe redelivering is the fix.
    console.error("[stripe] failed to process", type, err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
