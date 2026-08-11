import Link from "next/link";
import { fill, getDict } from "@oma/core";
import { createClient } from "@/lib/supabase/server";

interface PlanRow {
  unlimited: boolean;
  holdings_used: number;
  holdings_max: number;
}

/**
 * Plan summary on the account page.
 *
 * Deliberately the same numbers as /plan, read from the same function, because
 * the one thing this must never do is tell someone they have room when the
 * database will refuse the next insert.
 *
 * It stays quiet when there is nothing to say. Somebody with three items does
 * not need a progress bar towards a ceiling they will not see for a year, and
 * showing one to every free user turns the account page into an advert.
 */
export async function PlanCard({ t }: { t: ReturnType<typeof getDict> }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_plan");
  const plan = (Array.isArray(data) ? data[0] : null) as PlanRow | null;
  if (!plan) return null;

  const { unlimited, holdings_used: used, holdings_max: max } = plan;
  const left = Math.max(0, max - used);
  // Two thirds of the way is when the number starts being information rather
  // than noise.
  const worthShowing = unlimited || used >= max * 0.66;
  if (!worthShowing) return null;

  return (
    <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <p className="text-xs text-muted">{t.planCurrent}</p>
        <p className="mt-0.5 text-sm font-semibold">
          {unlimited ? t.planUnlimited : t.planFree}
        </p>
        {!unlimited && (
          <p className="tnum mt-1 text-xs text-muted">
            {t.planRegistered} {used} / {max} {t.planUnitItems}
            {left > 0 && ` · ${fill(t.planNearLimit, { left })}`}
          </p>
        )}
      </div>

      <Link href="/plan" className="btn-secondary shrink-0 px-4 py-2 text-sm">
        {t.planTitle}
      </Link>
    </section>
  );
}
