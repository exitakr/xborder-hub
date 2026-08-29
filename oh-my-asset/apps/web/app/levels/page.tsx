import type { Metadata } from "next";
import { LEVELS, formatMoney, getDict, levelFor } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { optionalProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Collector level" };

interface Metrics {
  items_ever: number;
  value_jpy: number;
  level_peak: number;
}

/**
 * The ladder, written down.
 *
 * A level nobody can look up is arbitrary, and an arbitrary level is worth
 * nothing to the person who has one — there is no pleasure in outranking
 * someone by a rule neither of you can state. So every threshold is on this
 * page, both ladders side by side, with the reader's own row marked.
 *
 * Public rather than behind the login wall, because "what do the levels mean"
 * is a question somebody asks about the app before deciding to try it.
 */
export default async function LevelsPage() {
  const profile = await optionalProfile();
  const locale = profile?.locale ?? (await getLocale());
  const t = getDict(locale);

  // Signed-out visitors get the ladder without a highlighted row, which is the
  // whole page minus one piece of personalisation.
  let standing: ReturnType<typeof levelFor> | null = null;
  if (profile) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("my_level_metrics");
    const m = (Array.isArray(data) ? data[0] : null) as Metrics | null;
    if (m) {
      standing = levelFor(Number(m.items_ever), Number(m.value_jpy), Number(m.level_peak));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.lvTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.lvLead}</p>
      </div>

      <section className="card overflow-hidden">
        {/* A table, because two ladders that have to be compared row by row is
            exactly what a table is for. It scrolls inside its own box rather
            than pushing the page sideways on a phone. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">{t.lvTableLevel}</th>
                <th className="px-4 py-3 font-medium">{t.lvTableName}</th>
                <th className="px-4 py-3 text-right font-medium">{t.lvTableItems}</th>
                <th className="px-4 py-3 text-right font-medium">{t.lvTableValue}</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((tier) => {
                const mine = standing?.level === tier.level;
                return (
                  <tr
                    key={tier.level}
                    className={`border-b border-line last:border-0 ${
                      mine ? "bg-accent/10" : ""
                    }`}
                  >
                    <td className="tnum px-4 py-3 font-medium">
                      {tier.level}
                      {mine && (
                        <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-canvas">
                          {t.lvLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{t[tier.nameKey]}</td>
                    <td className="tnum px-4 py-3 text-right text-muted">
                      {tier.minItems}
                    </td>
                    <td className="tnum px-4 py-3 text-right text-muted">
                      {tier.minValueJpy === 0
                        ? "—"
                        : formatMoney(tier.minValueJpy, "JPY", locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold">{t.lvHowTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{t.lvHowBody}</p>
        <p className="text-sm leading-relaxed text-muted">{t.lvHowNeverDown}</p>
        <p className="text-sm leading-relaxed text-muted">{t.lvHowValueNote}</p>
      </section>
    </div>
  );
}
