import Link from "next/link";
import type { Metadata } from "next";
import { formatMoney, getDict } from "@oma/core";
import { requireProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { RefreshPricesButton } from "./RefreshPricesButton";
import { markContactHandled } from "./actions";

export const metadata: Metadata = { title: "Admin" };

interface Kpis {
  users_total: number;
  users_new_7d: number;
  users_new_30d: number;
  users_prev_30d: number;
  active_7d: number;
  active_30d: number;
  users_with_holdings: number;
  holdings_total: number;
  transactions_total: number;
  transactions_30d: number;
  tracked_value_jpy: number;
  items_total: number;
  items_priced: number;
  items_user_added: number;
  price_reports_total: number;
  self_reported_total: number;
  snapshots_total: number;
  last_price_refresh: string | null;
  contact_open: number;
}

interface Member {
  id: string;
  email: string | null;
  display_name: string | null;
  locale: string | null;
  base_currency: string | null;
  is_admin: boolean;
  created_at: string;
  holdings_count: number;
  transactions_count: number;
  last_activity: string | null;
}

interface PlanKpis {
  paid_total: number;
  paid_30d: number;
  at_limit: number;
  near_limit: number;
}

interface Message {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  body: string;
  locale: string;
  handled: boolean;
  created_at: string;
}

export default async function AdminPage() {
  const profile = await requireProfile();
  const t = getDict(profile.locale);

  // Every function below re-checks is_admin() in the database. This decides
  // what to render; it is not the access control.
  if (!profile.isAdmin) {
    return <p className="py-16 text-center text-sm text-muted">{t.adForbidden}</p>;
  }

  const supabase = await createClient();
  const [kpiRes, memberRes, messageRes, planRes] = await Promise.all([
    supabase.rpc("admin_kpis"),
    supabase.rpc("admin_members", { p_limit: 200 }),
    supabase.rpc("admin_contact_messages", { p_limit: 100 }),
    supabase.rpc("admin_plan_kpis"),
  ]);

  const k = (Array.isArray(kpiRes.data) ? kpiRes.data[0] : null) as Kpis | null;
  const members = (memberRes.data ?? []) as Member[];
  const messages = (messageRes.data ?? []) as Message[];
  // Added by migration 0015. Absent rather than fatal on an older database, so
  // a deployment that has not run it yet still gets the rest of the dashboard.
  const plans = (Array.isArray(planRes.data) ? planRes.data[0] : null) as PlanKpis | null;

  /*
   * Why the dashboard is empty, in the dashboard.
   *
   * "Please try again shortly" is the wrong thing to tell the one person who
   * can actually fix this. The overwhelmingly likely cause is that migration
   * 0011 has not been run, in which case these functions do not exist at all —
   * and the Postgres error says so precisely. This surface is already behind
   * an is_admin check that the functions themselves repeat, so the message is
   * only ever shown to the operator.
   */
  const failure =
    kpiRes.error?.message ?? memberRes.error?.message ?? messageRes.error?.message ?? null;

  // Month-on-month signup growth. Null rather than 0% when the comparison
  // period is empty: "no prior month" and "no growth" are different claims.
  const growth =
    k && k.users_prev_30d > 0 ? (k.users_new_30d - k.users_prev_30d) / k.users_prev_30d : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.adDashTitle}</h1>
          <p className="mt-1 text-sm text-muted">{t.adDashLead}</p>
        </div>
        <Link href="/admin/prices" className="btn-secondary shrink-0">
          {t.adTitle}
        </Link>
      </div>

      {!k ? (
        <section className="card border-loss/40 p-5">
          <h2 className="text-sm font-semibold text-loss">{t.adSetupTitle}</h2>
          <p className="mt-2 text-sm text-muted">{t.adSetupBody}</p>
          {failure && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-muted">
              {failure}
            </pre>
          )}
        </section>
      ) : (
        <>
          <section className="card p-5">
            <h2 className="text-sm font-semibold">{t.adKpiUsers}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label={t.adKpiTotalUsers} value={k.users_total} />
              <Kpi label={t.adKpiNew7} value={k.users_new_7d} />
              <Kpi label={t.adKpiNew30} value={k.users_new_30d} />
              <Kpi
                label={t.adKpiGrowth}
                value={growth === null ? "—" : `${growth >= 0 ? "+" : ""}${(growth * 100).toFixed(0)}%`}
                tone={growth === null ? "" : growth >= 0 ? "text-gain" : "text-loss"}
              />
              <Kpi label={t.adKpiActive7} value={k.active_7d} />
              <Kpi label={t.adKpiActive30} value={k.active_30d} />
              <Kpi label={t.adKpiWithHoldings} value={k.users_with_holdings} />
              <Kpi
                label={t.adKpiActivation}
                value={
                  k.users_total > 0
                    ? `${((k.users_with_holdings / k.users_total) * 100).toFixed(0)}%`
                    : "—"
                }
              />
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold">{t.adKpiEngagement}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label={t.adKpiHoldings} value={k.holdings_total} />
              <Kpi label={t.adKpiTx} value={k.transactions_total} />
              <Kpi label={t.adKpiTx30} value={k.transactions_30d} />
              <Kpi
                label={t.adKpiTracked}
                value={formatMoney(Number(k.tracked_value_jpy), "JPY", profile.locale)}
              />
              <Kpi label={t.adKpiCommunity} value={k.price_reports_total} />
              <Kpi label={t.adKpiSelfReported} value={k.self_reported_total} />
              <Kpi label={t.adKpiUserItems} value={k.items_user_added} />
              <Kpi label={t.adKpiOpenContact} value={k.contact_open} />
            </dl>
          </section>

          {/* Paid conversion is the first number anyone valuing this business
              asks for, so it sits in the dashboard rather than in a query
              somebody has to remember to run. */}
          {plans && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold">{t.adKpiPlans}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label={t.adKpiPaid} value={Number(plans.paid_total)} />
                <Kpi label={t.adKpiPaid30} value={Number(plans.paid_30d)} />
                <Kpi
                  label={t.adKpiConversion}
                  value={
                    k.users_total > 0
                      ? `${((Number(plans.paid_total) / k.users_total) * 100).toFixed(1)}%`
                      : "—"
                  }
                />
                {/* Free accounts sitting on the ceiling: the people the upgrade
                    prompt is actually in front of, and the best leading
                    indicator of revenue available before payments are live. */}
                <Kpi
                  label={t.adKpiAtLimit}
                  value={Number(plans.at_limit)}
                  tone={Number(plans.at_limit) > 0 ? "text-accent" : ""}
                />
                <Kpi label={t.adKpiNearLimit} value={Number(plans.near_limit)} />
              </dl>
            </section>
          )}

          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{t.adKpiData}</h2>
              <RefreshPricesButton t={t} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label={t.adKpiItems} value={k.items_total} />
              <Kpi
                label={t.adKpiCoverage}
                value={
                  k.items_total > 0
                    ? `${((k.items_priced / k.items_total) * 100).toFixed(0)}%`
                    : "—"
                }
                tone={
                  k.items_total > 0 && k.items_priced / k.items_total < 0.5 ? "text-loss" : ""
                }
              />
              <Kpi label={t.adKpiSnapshots} value={k.snapshots_total} />
              <Kpi
                label={t.adKpiLastRefresh}
                value={
                  k.last_price_refresh
                    ? new Date(k.last_price_refresh).toLocaleString(
                        profile.locale === "ja" ? "ja-JP" : "en-SG",
                      )
                    : "—"
                }
              />
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold">
              {t.adContact} <span className="tnum text-muted">({messages.length})</span>
            </h2>

            {messages.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t.adNoContact}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg border p-3 ${
                      m.handled ? "border-line opacity-60" : "border-accent/40 bg-accent/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{m.subject}</p>
                      <p className="tnum text-xs text-muted">
                        {new Date(m.created_at).toLocaleString(
                          profile.locale === "ja" ? "ja-JP" : "en-SG",
                        )}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {m.email}
                      {m.user_id ? ` · ${t.adContactMember}` : ` · ${t.adContactGuest}`}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>

                    <form action={markContactHandled} className="mt-3">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="handled" value={String(!m.handled)} />
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                        {m.handled ? t.adContactReopen : t.adContactDone}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold">
              {t.adMembers} <span className="tnum text-muted">({members.length})</span>
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th className="pb-2 pr-3 font-medium">{t.authEmail}</th>
                    <th className="pb-2 pr-3 font-medium">{t.authDisplayName}</th>
                    <th className="pb-2 pr-3 text-right font-medium">{t.adKpiHoldings}</th>
                    <th className="pb-2 pr-3 text-right font-medium">{t.adKpiTx}</th>
                    <th className="pb-2 pr-3 font-medium">{t.adMemberJoined}</th>
                    <th className="pb-2 font-medium">{t.adMemberLastSeen}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-line/60">
                      <td className="py-2 pr-3">
                        {m.email ?? "—"}
                        {m.is_admin && (
                          <span className="ml-1.5 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                            admin
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-muted">{m.display_name ?? "—"}</td>
                      <td className="tnum py-2 pr-3 text-right">{m.holdings_count}</td>
                      <td className="tnum py-2 pr-3 text-right">{m.transactions_count}</td>
                      <td className="tnum py-2 pr-3 text-muted">
                        {new Date(m.created_at).toLocaleDateString(
                          profile.locale === "ja" ? "ja-JP" : "en-SG",
                        )}
                      </td>
                      <td className="tnum py-2 text-muted">
                        {m.last_activity
                          ? new Date(m.last_activity).toLocaleDateString(
                              profile.locale === "ja" ? "ja-JP" : "en-SG",
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
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
