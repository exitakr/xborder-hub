"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe";
import { site } from "@/lib/site";

/**
 * Send the buyer to Stripe.
 *
 * Nothing about the price, the currency or the product lives in this file.
 * They live in the Stripe dashboard behind `STRIPE_PRICE_ID`, which is what
 * makes it impossible for a form field to decide what something costs — the
 * client sends no amount, and there is no amount here for it to send.
 *
 * The redirect happens on the server for the same reason: a checkout URL
 * returned to the browser and followed by client code is a URL that can be
 * intercepted, and there is no step in between worth having.
 */
export async function startCheckout(): Promise<void> {
  const profile = await requireProfile();

  if (!stripeConfigured()) {
    // The button is not rendered in this state; reaching here means someone
    // posted to the action directly.
    redirect("/plan?error=unavailable");
  }

  // Already paid — sending them to checkout would take a second ¥100 for
  // something they own. `my_plan` is the same source the page renders from.
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_plan");
  const plan = (Array.isArray(data) ? data[0] : null) as { unlimited?: boolean } | null;
  if (plan?.unlimited) redirect("/plan");

  let url: string;
  try {
    url = await createCheckoutSession({
      userId: profile.userId,
      email: profile.email,
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
