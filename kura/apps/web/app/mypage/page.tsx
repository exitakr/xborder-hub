import type { Metadata } from "next";
import { getDict } from "@kura/core";
import { requireProfile } from "@/lib/profile";
import { loadPortfolio } from "@kura/core";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@kura/core";
import { DeleteAccount, ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Account" };

export default async function MyPage() {
  const profile = await requireProfile();
  const t = getDict(profile.locale);
  const supabase = await createClient();
  const view = await loadPortfolio(supabase, profile.userId, profile.currency);

  // The incentive to report a sale is that it demonstrably helps other people.
  // That is only true if the app shows the reach, so it is surfaced here rather
  // than left as something the contributor has to take on trust.
  const { data: contribution } = await supabase.rpc("my_contribution_stats");
  const stats = Array.isArray(contribution) ? contribution[0] : null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.myTitle}</h1>

      <ProfileForm
        t={t}
        displayName={profile.displayName ?? ""}
        currency={profile.currency}
        locale={profile.locale}
      />

      <section className="card p-5">
        <h2 className="text-sm font-semibold">{t.myStats}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted">{t.myRealizedTotal}</dt>
            <dd
              className={`tnum mt-0.5 text-sm font-medium ${
                view.totals.realized > 0
                  ? "text-gain"
                  : view.totals.realized < 0
                    ? "text-loss"
                    : ""
              }`}
            >
              {formatMoney(view.totals.realized, view.currency, profile.locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t.myItemCount}</dt>
            <dd className="tnum mt-0.5 text-sm font-medium">{view.holdings.length}</dd>
          </div>
        </dl>
      </section>

      {stats && Number(stats.reports) > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold">{t.cmMyReports}</h2>
          <p className="mt-1 text-xs text-muted">{t.cmStatsLead}</p>
          <dl className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-muted">{t.cmStatsReports}</dt>
              <dd className="tnum mt-0.5 text-sm font-medium">{Number(stats.reports)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t.cmStatsItems}</dt>
              <dd className="tnum mt-0.5 text-sm font-medium">{Number(stats.items_covered)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t.cmStatsUnlocked}</dt>
              <dd className="tnum mt-0.5 text-sm font-medium text-gain">
                {Number(stats.items_unlocked)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <DeleteAccount t={t} />
    </div>
  );
}
