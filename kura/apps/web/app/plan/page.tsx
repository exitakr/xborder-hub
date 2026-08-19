import Link from "next/link";
import type { Metadata } from "next";
import { fill, getDict } from "@oma/core";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { stripeConfigured } from "@/lib/stripe";
import { sellerConfigured } from "@/lib/seller";
import { SubmitButton } from "@/components/SubmitButton";
import { startCheckout } from "./actions";

export const metadata: Metadata = { title: "Plan" };

interface PlanRow {
  unlimited: boolean;
  holdings_used: number;
  holdings_max: number;
  expires_at: string | null;
}

/**
 * Plan and usage.
 *
 * Reached two ways: from the account page, and — the important one — by being
 * redirected here the moment an add is refused for hitting the limit. That
 * redirect is why the page has to state the count first and sell second. The
 * person who arrives here did not come shopping; they came because something
 * they tried to do did not happen, and the first thing they need is an
 * explanation of what stopped it.
 */
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string; paid?: string; error?: string }>;
}) {
  const profile = await requireProfile();
  const t = getDict(profile.locale);
  const { full, paid, error } = await searchParams;
  const canPay = stripeConfigured();
  const hasCommerceNotice = sellerConfigured();

  const supabase = await createClient();
  const { data } = await supabase.rpc("my_plan");
  const plan = (Array.isArray(data) ? data[0] : null) as PlanRow | null;

  // Every number on this page comes from the database, including the limit
  // itself — the trigger and the screen must not be able to disagree.
  const used = plan?.holdings_used ?? 0;
  const max = plan?.holdings_max ?? 0;
  const unlimited = plan?.unlimited ?? false;
  const left = Math.max(0, max - used);
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.planTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.planLead}</p>
      </div>

      {/* Stripe sends the buyer back here, and the webhook that grants the
          entitlement may land a second later. Saying so is better than showing
          a "Free" badge to someone who has just paid and letting them conclude
          the payment failed. */}
      {paid === "1" && (
        <div role="status" className="card border-gain/40 p-4">
          <p className="text-sm font-semibold text-gain">{t.planPaidTitle}</p>
          {!unlimited && <p className="mt-1 text-sm text-muted">{t.planPaidBody}</p>}
        </div>
      )}

      {error && (
        <div role="alert" className="card border-loss/40 p-4">
          <p className="text-sm text-loss">{t.planPayError}</p>
        </div>
      )}

      {full === "1" && !unlimited && (
        <div role="alert" className="card border-loss/40 p-4">
          <p className="text-sm font-semibold text-loss">{t.planFullTitle}</p>
          <p className="mt-1 text-sm text-muted">{fill(t.planFullBody, { max })}</p>
        </div>
      )}

      <section className="card p-5">
        <p className="text-xs text-muted">{t.planCurrent}</p>
        <p className="mt-0.5 text-xl font-semibold">
          {unlimited ? t.planUnlimited : t.planFree}
        </p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm text-muted">{t.planRegistered}</span>
          <span className="tnum text-sm font-medium">
            {used}
            {!unlimited && ` / ${max}`} {t.planUnitItems}
          </span>
        </div>

        {/* A bar rather than only a fraction: "17 / 20" needs arithmetic to
            feel like anything, and how close you are to the ceiling is the
            single fact this card exists to convey. */}
        {!unlimited && (
          <>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={max}
            >
              <div
                className={`h-full rounded-full ${pct >= 100 ? "bg-loss" : "bg-accent"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {left > 0 && left <= 5 && (
              <p className="mt-2 text-xs text-muted">{fill(t.planNearLimit, { left })}</p>
            )}
          </>
        )}
      </section>

      {unlimited ? (
        <section className="card border-gain/40 p-5">
          <p className="text-sm font-semibold text-gain">{t.planActive}</p>
          <p className="mt-1 text-sm text-muted">{t.planBenefit1}</p>
        </section>
      ) : (
        <section className="card border-accent/50 p-5">
          <h2 className="text-base font-semibold">{t.planUpgradeTitle}</h2>
          <p className="mt-2">
            <span className="text-3xl font-semibold text-accent">{t.planPrice}</span>
            <span className="ml-2 text-sm text-muted">{t.planPriceNote}</span>
          </p>

          <ul className="mt-4 space-y-1.5 text-sm">
            <Benefit>{t.planBenefit1}</Benefit>
            <Benefit>{t.planBenefit2}</Benefit>
            <Benefit>{t.planBenefit3}</Benefit>
          </ul>

          {/*
           * The button appears only when Stripe is actually configured.
           *
           * A purchase button that cannot take money is worse than none: it
           * collects the intent and then fails, which is the exact moment a
           * person decides the app is broken. So the two states are separate
           * and the environment decides between them — there is no way to
           * deploy a live-looking button over a dead payment path.
           */}
          {canPay ? (
            <form action={startCheckout} className="mt-5">
              <SubmitButton pendingLabel={t.loading} className="btn-primary w-full">
                {fill(t.planBuyCta, { price: t.planPrice })}
              </SubmitButton>
              <p className="mt-2 text-center text-xs text-muted">{t.planPayNote}</p>
              {/* Article 11 of the Specified Commercial Transactions Act wants
                  the seller's details readable BEFORE the buyer pays, not
                  discoverable afterwards in the footer. This is the last screen
                  before Stripe, so it is where the link belongs. */}
              <p className="mt-3 text-center text-xs">
                <Link href="/legal/terms" className="text-muted underline hover:text-ink">
                  {t.legalTerms}
                </Link>
                {hasCommerceNotice && (
                  <>
                    <span className="mx-2 text-muted">·</span>
                    <Link href="/legal/commerce" className="text-muted underline hover:text-ink">
                      {t.legalCommerce}
                    </Link>
                  </>
                )}
              </p>
            </form>
          ) : (
            <div className="mt-5 rounded-lg bg-canvas p-3">
              <p className="text-sm font-medium">{t.planComingSoon}</p>
              <p className="mt-1 text-xs text-muted">{t.planComingSoonBody}</p>
              <Link href="/contact" className="btn-secondary mt-3 w-full sm:w-auto">
                {t.planContact}
              </Link>
            </div>
          )}
        </section>
      )}

      {/* The reasoning, in the product rather than only in a commit message.
          A limit with a stated principle behind it reads as a decision; the
          same limit unexplained reads as an extraction. */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold">{t.planWhyTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.planWhyBody}</p>
      </section>
    </div>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden="true" className="mt-0.5 text-gain">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
