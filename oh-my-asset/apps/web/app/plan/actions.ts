"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  createPortalSession,
  stripeConfigured,
  type BillingInterval,
} from "@/lib/stripe";
import { site } from "@/lib/site";

/**
 * Send the buyer to Stripe.
 *
 * Nothing about the price, the currency or the billing interval lives in this
 * file. They live in the Stripe dashboard behind price IDs, which is what makes
 * it impossible for a form field to decide what something costs — the client
 * sends an interval, never an amount, and the interval is checked against a
 * fixed pair before it reaches Stripe.
 *
 * The redirect happens on the server for the same reason: a checkout URL
 * returned to the browser and followed by client code is a URL that can be
 * intercepted, and there is no step in between worth having.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const profile = await requireProfile();

  const raw = formData.get("interval");
  const interval: BillingInterval = raw === "year" ? "year" : "month";

  if (!stripeConfigured()) {
    // The button is not rendered in this state; reaching here means someone
    // posted to the action directly.
    redirect("/plan?error=unavailable");
  }

  // Already subscribed — sending them to checkout would open a second
  // subscription against the same account. Changing plan goes through the
  // portal, which knows how to prorate.
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_plan");
  const plan = (Array.isArray(data) ? data[0] : null) as {
    unlimited?: boolean;
    has_customer?: boolean;
  } | null;
  if (plan?.unlimited) redirect("/plan");

  const { data: customerRow } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profile.userId)
    .maybeSingle();

  let url: string;
  try {
    url = await createCheckoutSession({
      userId: profile.userId,
      email: profile.email,
      customerId: (customerRow?.stripe_customer_id as string | null) ?? null,
      interval,
      // Stripe redirects here on success, but the entitlement is granted by
      // the webhook, not by this URL being visited. A buyer who closes the tab
      // still gets what they paid for, and a curious person who types the
      // success URL gets nothing.
      successUrl: `${site.domain}/plan?paid=1`,
      cancelUrl: `${site.domain}/plan`,
      locale: profile.locale,
    });
  } catch (err) {
    console.error("[checkout] could not create session", err);
    redirect("/plan?error=1");
  }

  redirect(url);
}

/**
 * Open Stripe's billing portal.
 *
 * Where a subscriber cancels, swaps card, changes plan or downloads a receipt.
 * Required rather than optional: the 2022 amendment to the Specified
 * Commercial Transactions Act obliges a recurring seller to make cancellation
 * no harder than signing up, and a cancellation that runs through a contact
 * form and a human reply is precisely the pattern it exists to stop.
 */
export async function openBillingPortal(): Promise<void> {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profile.userId)
    .maybeSingle();

  const customerId = (data?.stripe_customer_id as string | null) ?? null;
  if (!customerId) redirect("/plan?error=nocustomer");

  let url: string;
  try {
    url = await createPortalSession({
      customerId,
      returnUrl: `${site.domain}/plan`,
      locale: profile.locale,
    });
  } catch (err) {
    console.error("[billing] could not open portal", err);
    redirect("/plan?error=1");
  }

  redirect(url);
}
