"use client";

import { useActionState } from "react";
import type { getDict } from "@oma/core";
import { sendTestEmail, type TestEmailState } from "./actions";

export interface EmailHealthRow {
  unconfirmed_total: number;
  unconfirmed_7d: number;
  signups_7d: number;
  confirmed_7d: number;
  oldest_pending_hours: number | null;
}

/**
 * Whether confirmation emails are landing.
 *
 * A signup that is never confirmed looks like a success from the inside: the
 * row exists, the app said "check your email", and nothing ever reports that
 * the message bounced. This turns that silence into two numbers and a button,
 * so a broken sender is noticed by the operator rather than by the users it is
 * quietly costing.
 */
export function EmailHealth({
  t,
  health,
  defaultEmail,
}: {
  t: ReturnType<typeof getDict>;
  health: EmailHealthRow;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState<TestEmailState, FormData>(
    sendTestEmail,
    {},
  );

  const signups = Number(health.signups_7d);
  const confirmed = Number(health.confirmed_7d);
  const rate = signups > 0 ? confirmed / signups : null;

  // Below two thirds is not "some people changed their minds" — it is a
  // delivery problem worth interrupting the operator for.
  const unhealthy = rate !== null && signups >= 3 && rate < 0.66;

  return (
    <section className={`card p-5 ${unhealthy ? "border-loss/40" : ""}`}>
      <h2 className="text-sm font-semibold">{t.adEmailTitle}</h2>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label={t.adEmailUnconfirmed}
          value={Number(health.unconfirmed_total)}
          tone={Number(health.unconfirmed_total) > 0 ? "text-loss" : ""}
        />
        <Stat label={t.adEmailUnconfirmed7} value={Number(health.unconfirmed_7d)} />
        <Stat
          label={t.adEmailConfirmRate}
          value={rate === null ? "—" : `${(rate * 100).toFixed(0)}%`}
          tone={unhealthy ? "text-loss" : rate !== null ? "text-gain" : ""}
        />
        <Stat
          label={t.adEmailOldest}
          value={
            health.oldest_pending_hours === null
              ? "—"
              : `${Number(health.oldest_pending_hours).toFixed(0)}${t.adEmailHours}`
          }
        />
      </dl>

      {unhealthy && <p className="mt-3 text-xs text-loss">{t.adEmailWarn}</p>}

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold">{t.adEmailTestTitle}</h3>
        <p className="mt-1 text-xs text-muted">{t.adEmailTestLead}</p>

        <form action={action} className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            defaultValue={defaultEmail}
            aria-label={t.authEmail}
            className="field min-w-0 flex-1"
          />
          <button type="submit" disabled={pending} className="btn-secondary shrink-0">
            {pending ? t.loading : t.adEmailTestSend}
          </button>
        </form>

        {state.ok && <p className="mt-2 text-xs text-gain">{t.adEmailTestOk}</p>}
        {/* The provider's own words. On this screen that is the useful form: a
            429 and "Error sending confirmation email" point at different fixes,
            and a friendly paraphrase would erase the difference. */}
        {state.error && (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-2 text-xs text-loss">
            {state.error}
          </pre>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tnum mt-0.5 text-lg font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
