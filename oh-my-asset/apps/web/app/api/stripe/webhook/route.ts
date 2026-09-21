import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieve, verifyWebhook } from "@/lib/stripe";

/**
 * Where a payment becomes an entitlement, and where revenue is booked.
 *
 * The only place in the app that grants the paid product, and reachable by
 * anyone on the internet, so it is written to be boring:
 *
 *  1. verify the signature against the RAW body — the request is otherwise
 *     just a POST claiming to be from Stripe;
 *  2. act only on the events that mean something here;
 *  3. carry the Supabase user id from metadata Stripe was given at checkout,
 *     never from an email address, and refuse the event without it;
 *  4. let the database de-duplicate on the subscription and invoice ids,
 *     because Stripe retries and will send all of this again.
 *
 * It always answers 200 once the signature checks out, including when there is
 * nothing to do. A non-2xx tells Stripe to retry, and retrying an event we have
 * decided to ignore just produces the same decision hourly for three days.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface StripeSubscription {
  id: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  customer?: string;
  metadata?: { user_id?: string };
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
}

export async function POST(request: Request) {
  const raw = await request.text();
  const event = await verifyWebhook(raw, request.headers.get("stripe-signature"));

  if (!event) {
    // Deliberately terse. An unsigned caller learns nothing about why.
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const type = event.type as string;
  const object = (event.data as { object?: Record<string, unknown> } | undefined)?.object ?? {};
  const supabase = createAdminClient();

  try {
    switch (type) {
      /*
       * Checkout finished. Its only job now is to bind the Stripe customer to
       * the account — the entitlement itself arrives on the subscription event,
       * which is also what will carry every later renewal. Granting here as
       * well would be a second code path to the same state, and the two would
       * eventually disagree.
       */
      case "checkout.session.completed": {
        const userId = object.client_reference_id as string | null;
        const customer = object.customer as string | null;
        if (userId && customer) {
          await supabase.rpc("set_stripe_customer", { p_user: userId, p_customer: customer });
        }
        return NextResponse.json({ ok: true, linked: Boolean(userId && customer) });
      }

      /*
       * The subscription's life, in one handler.
       *
       * created / updated / deleted all describe the same object in different
       * states, and all three want exactly the same write: store the status and
       * the period end. Splitting them would mean three chances to handle one
       * of the states slightly differently.
       */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = object as unknown as StripeSubscription;
        const userId = sub.metadata?.user_id ?? null;
        if (!userId) {
          console.error("[stripe] subscription event without user_id metadata", sub.id);
          return NextResponse.json({ ok: true, ignored: "no user" });
        }

        // `deleted` means gone now, whatever the period end said.
        const status =
          type === "customer.subscription.deleted"
            ? "canceled"
            : sub.status === "active" || sub.status === "trialing"
              ? "active"
              : sub.status === "past_due" || sub.status === "unpaid"
                ? "past_due"
                : "canceled";

        const expires =
          type === "customer.subscription.deleted"
            ? new Date().toISOString()
            : sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null;

        const { error } = await supabase.rpc("grant_subscription", {
          p_user: userId,
          p_subscription_id: sub.id,
          p_status: status,
          p_expires: expires,
          p_interval: sub.items?.data?.[0]?.price?.recurring?.interval ?? null,
          p_cancel_at_end: Boolean(sub.cancel_at_period_end),
        });
        if (error) throw new Error(error.message);

        return NextResponse.json({ ok: true, status });
      }

      /*
       * Money actually moved. Two things follow, and they are separate on
       * purpose: the entitlement is extended, and the payment is booked.
       *
       * The ledger exists because Stripe's own history knows customers rather
       * than accounts, and goes with the Stripe account when it changes hands.
       * A buyer reconciling revenue against the product needs a record inside
       * the product.
       */
      case "invoice.paid": {
        const invoice = object as Record<string, unknown>;
        const subId = invoice.subscription as string | null;

        let userId: string | null = null;
        if (subId) {
          // The invoice does not carry the period end, and acting on a stale
          // payload is how an entitlement ends up with the wrong expiry. One
          // request removes the guesswork.
          const sub = await retrieve<StripeSubscription>(`subscriptions/${subId}`);
          userId = sub?.metadata?.user_id ?? null;

          if (sub && userId) {
            await supabase.rpc("grant_subscription", {
              p_user: userId,
              p_subscription_id: sub.id,
              p_status: sub.status === "active" ? "active" : sub.status,
              p_expires: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
              p_interval: sub.items?.data?.[0]?.price?.recurring?.interval ?? null,
              p_cancel_at_end: Boolean(sub.cancel_at_period_end),
            });
          }
        }

        await bookRevenue(supabase, {
          externalId: String(invoice.id),
          userId,
          kind: "charge",
          gross: Number(invoice.amount_paid ?? 0),
          currency: String(invoice.currency ?? "jpy").toUpperCase(),
          occurredAt: new Date(Number(invoice.created ?? Date.now() / 1000) * 1000).toISOString(),
          description: (invoice.number as string | null) ?? null,
          chargeId: (invoice.charge as string | null) ?? null,
        });

        return NextResponse.json({ ok: true, booked: true });
      }

      /*
       * A refund or a chargeback takes the product back and reverses the book
       * entry. Without this, the cheapest subscription is one you dispute.
       */
      case "charge.refunded":
      case "charge.dispute.created": {
        const charge = object as Record<string, unknown>;
        const intent =
          (charge.payment_intent as string | null) ?? (charge.charge as string | null) ?? null;

        const { data: ent } = await supabase
          .from("entitlements")
          .select("user_id")
          .eq("receipt_id", intent ?? "")
          .maybeSingle();

        await bookRevenue(supabase, {
          externalId: `${type}:${String(charge.id)}`,
          userId: (ent?.user_id as string | null) ?? null,
          kind: type === "charge.refunded" ? "refund" : "chargeback",
          gross: Number(charge.amount_refunded ?? charge.amount ?? 0),
          currency: String(charge.currency ?? "jpy").toUpperCase(),
          occurredAt: new Date().toISOString(),
          description: type,
          chargeId: String(charge.id),
        });

        return NextResponse.json({ ok: true, reversed: true });
      }

      default:
        return NextResponse.json({ ok: true, ignored: type });
    }
  } catch (err) {
    // A 500 here IS worth a retry: the signature was good and the event is
    // real, so the failure is ours and Stripe redelivering is the fix.
    console.error("[stripe] failed to process", type, err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

/**
 * Write one line into the revenue ledger.
 *
 * The processor's fee is fetched from the balance transaction rather than
 * estimated, because net revenue is the figure an acquirer discounts and a
 * guessed fee makes every month's number arguable. When it cannot be fetched
 * the fee is left at zero and the gross still books — a missing fee is a gap
 * in one column, a missing row is a gap in the revenue history.
 */
async function bookRevenue(
  supabase: ReturnType<typeof createAdminClient>,
  e: {
    externalId: string;
    userId: string | null;
    kind: "charge" | "refund" | "chargeback";
    gross: number;
    currency: string;
    occurredAt: string;
    description: string | null;
    chargeId: string | null;
  },
): Promise<void> {
  let fee = 0;
  let net = e.gross;

  if (e.chargeId) {
    const charge = await retrieve<{ balance_transaction?: string }>(`charges/${e.chargeId}`);
    if (charge?.balance_transaction) {
      const tx = await retrieve<{ fee?: number; net?: number }>(
        `balance_transactions/${charge.balance_transaction}`,
      );
      if (tx) {
        fee = Number(tx.fee ?? 0);
        net = Number(tx.net ?? e.gross);
      }
    }
  }

  const { error } = await supabase.rpc("record_revenue", {
    p_external_id: e.externalId,
    p_user: e.userId,
    p_kind: e.kind,
    p_gross: e.gross,
    p_fee: fee,
    p_net: net,
    p_currency: e.currency,
    p_occurred_at: e.occurredAt,
    p_description: e.description,
  });
  if (error) throw new Error(error.message);
}
