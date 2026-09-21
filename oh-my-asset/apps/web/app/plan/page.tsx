import Link from "next/link";
import type { Metadata } from "next";
import { fill, getDict } from "@oma/core";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { stripeConfigured } from "@/lib/stripe";
import { sellerConfigured } from "@/lib/seller";
import { SubmitButton } from "@/components/SubmitButton";
import { openBillingPortal, startCheckout } from "./actions";

export const metadata: Metadata = { title: "Plan" };

interface PlanRow {
  unlimited: boolean;
  holdings_used: number;
  holdings_max: number;
  expires_at: string | null;
  /** Migration 0028 — absent on a database that has not run it yet. */
  status?: string | null;
  bill_interval?: string | null;
  cancel_at_period_end?: boolean;
  has_customer?: boolean;
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

          {/* What happens next, and when.
              
              A subscriber who has cancelled still has paid time left, and a
              screen that just says "active" hides the date they actually care
              about. A failed payment is likewise not a reason to say nothing —
              they can fix it, and only if told. */}
          {plan?.expires_at && (
            <p className="mt-3 text-sm">
              {plan.cancel_at_period_end ? (
                <span className="text-muted">
                  {fill(t.planCanceledNotice, {
                    date: formatDay(plan.expires_at, profile.locale),
                  })}
                </span>
              ) : plan.status === "past_due" ? (
                <span className="text-loss">
                  {fill(t.planPastDue, {
                    date: formatDay(plan.expires_at, profile.locale),
                  })}
                </span>
              ) : (
                <span className="text-muted">
                  {t.planRenews}: {formatDay(plan.expires_at, profile.locale)}
                </span>
              )}
            </p>
          )}

          {/* Cancellation has to be this easy.
              
              The 2022 amendment to the Specified Commercial Transactions Act
              obliges a recurring seller to make stopping no harder than
              starting. A cancellation that runs through a contact form and a
              human reply is the exact pattern it was written to stop. */}
          {plan?.has_customer && (
            <form action={openBillingPortal} className="mt-4">
              <p className="mb-2 text-xs text-muted">{t.planManageLead}</p>
              <SubmitButton pendingLabel={t.loading} className="btn-secondary">
                {t.planManage}
              </SubmitButton>
            </form>
          )}
        </section>
      ) : (
        <section className="card border-accent/50 p-5">
          <h2 className="text-base font-semibold">{t.planUpgradeTitle}</h2>

          <ul className="mt-4 space-y-1.5 text-sm">
            <Benefit>{t.planBenefit1}</Benefit>
            <Benefit>{t.planBenefit2}</Benefit>
            <Benefit>{t.planBenefit3}</Benefit>
          </ul>

          {canPay ? (
            <>
              {/* Two prices side by side rather than one with a toggle: the
                  annual saving is the argument for annual, and an argument
                  hidden behind a switch is an argument nobody reads. */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <form action={startCheckout} className="card border-line p-4 text-center">
                  <input type="hidden" name="interval" value="month" />
                  <p>
                    <span className="text-3xl font-semibold">{t.planPriceMonthly}</span>
                    <span className="text-sm text-muted">{t.planPerMonth}</span>
                  </p>
                  <SubmitButton pendingLabel={t.loading} className="btn-secondary mt-3 w-full">
                    {t.planPickMonthly}
                  </SubmitButton>
                </form>

                <form
                  action={startCheckout}
                  className="card border-accent p-4 text-center"
                >
                  <input type="hidden" name="interval" value="year" />
                  <p>
                    <span className="text-3xl font-semibold text-accent">
                      {t.planPriceYearly}
                    </span>
                    <span className="text-sm text-muted">{t.planPerYear}</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-gain">{t.planYearlySave}</p>
                  <SubmitButton pendingLabel={t.loading} className="btn-primary mt-3 w-full">
                    {t.planPickYearly}
                  </SubmitButton>
                </form>
              </div>

              {/*
                * The disclosures the law requires, on the screen before payment.
                *
                * Article 12-6 of the Specified Commercial Transactions Act, as
                * amended in 2022 for recurring purchases, requires that the
                * automatic renewal, its cadence, the amount, when delivery
                * starts and how to cancel all appear on the final confirmation
                * screen. Omitting any of them gives the buyer a statutory right
                * to rescind — which makes this block cheaper than the
                * alternative as well as correct.
                */}
              <div className="mt-5 rounded-lg bg-canvas p-4">
                <p className="text-xs font-semibold">{t.planSubTermsTitle}</p>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
                  <li>{t.planSubTerms1}</li>
                  <li>{t.planSubTerms2}</li>
                  <li>{t.planSubTerms3}</li>
                  <li>{t.planSubTerms4}</li>
                  <li>{t.planSubTerms5}</li>
                  <li>{t.planSubTerms6}</li>
                </ul>
              </div>

              <p className="mt-3 text-center text-xs text-muted">{t.planPayNote}</p>
              <p className="mt-2 text-center text-xs">
                <Link href="/legal/terms" className="text-muted underline hover:text-ink">
                  {t.legalTerms}
                </Link>
                {hasCommerceNotice && (
                  <>
                    <span className="mx-2 text-muted">·</span>
                    <Link
                      href="/legal/commerce"
                      className="text-muted underline hover:text-ink"
                    >
                      {t.legalCommerce}
                    </Link>
                  </>
                )}
              </p>
            </>
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

/**
 * A renewal or expiry date, in the reader's locale.
 *
 * Local rather than shared: the item screen's version formats a `date` column,
 * which is a bare day string, while this formats a `timestamptz`. Passing one
 * to the other silently shifts the date across a timezone boundary, which on a
 * renewal notice is the difference between "renews today" and "renewed
 * yesterday".
 */
function formatDay(iso: string, locale: "ja" | "en"): string {
  return new Date(iso).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-SG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
