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
  const view = await loadPortfolio(await createClient(), profile.userId, profile.currency);

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

      <DeleteAccount t={t} />
    </div>
  );
}
