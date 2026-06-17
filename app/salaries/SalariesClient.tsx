"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import {
  COUNTRY_OPTS,
  ENGLISH_USAGE_OPTS,
  INDUSTRY_OPTS,
  JPY_SALARY_OPTS,
  REMOTE_FREQ_OPTS,
  RENT_OPTS,
  ROLE_OPTS,
  SAVINGS_RATE_OPTS,
  VISA_OPTS,
  WEEKLY_HOURS_OPTS,
  labelOf,
} from "@/lib/profile/options";
import type {
  CompEntry,
  CompensationData,
} from "@/lib/supabase/database.types";
import { ContributeForm } from "./ContributeForm";

const COUNTRY_FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  Singapore: "🇸🇬",
  "Hong Kong": "🇭🇰",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  Indonesia: "🇮🇩",
  Malaysia: "🇲🇾",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Germany: "🇩🇪",
  Australia: "🇦🇺",
};

const BONUS_LABELS: Record<string, string> = {
  none: "なし",
  lt_1m: "〜1ヶ月分",
  "1_3m": "1〜3ヶ月分",
  "3_6m": "3〜6ヶ月分",
  gte_6m: "6ヶ月分以上",
};

type Filters = { country: string; industry: string; role: string };

export function SalariesClient({
  isLoggedIn,
  unlocked,
  own,
  entries,
  total,
  filters,
  profileDefaults,
}: {
  isLoggedIn: boolean;
  unlocked: boolean;
  own: CompensationData | null;
  entries: CompEntry[];
  total: number | null;
  filters: Filters;
  profileDefaults: {
    country: string;
    city: string;
    industry: string;
    role: string;
  };
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  // All signed-in members who have contributed see the real figures.
  // The previous premium gate (xbh_premium localStorage flag) was removed
  // when we shifted to a B2B revenue model — focus is on growing the
  // member base, with future revenue coming from job-ad placements.
  const premium = true;
  const [selected, setSelected] = useState<CompEntry | null>(null);

  function setFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    const params = new URLSearchParams();
    if (next.country) params.set("country", next.country);
    if (next.industry) params.set("industry", next.industry);
    if (next.role) params.set("role", next.role);
    const qs = params.toString();
    router.replace(`/salaries${qs ? `?${qs}` : ""}`);
  }

  return (
    <>
      <AppTopBar active="salaries" />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <section className="flex items-end justify-between gap-3 flex-wrap rise">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                💴 real numbers
              </p>
              <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
                年収データ
              </h1>
              <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">
                越境した人のリアルな年収・家賃・貯蓄率・ビザ。すべて匿名のレンジ値です。
              </p>
            </div>
            {unlocked && !showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="text-[11px] font-bold text-blue underline underline-offset-2"
              >
                自分のデータを編集
              </button>
            )}
          </section>

          {/* Contribution form (first-time or edit) */}
          {showForm && (
            <ContributeForm
              own={own}
              defaults={profileDefaults}
              onDone={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Locked state */}
          {!unlocked && !showForm && (
            <section className="relative">
              {/* Blurred placeholder cards (presentation only, not data) */}
              <div
                className="space-y-2 blur-[6px] select-none pointer-events-none opacity-70"
                aria-hidden
              >
                {PLACEHOLDER_CARDS.map((c, i) => (
                  <article
                    key={i}
                    className="bg-cream border border-ink/20 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-[13px] text-ink">
                        {c.head}
                      </p>
                      <p className="display font-bold text-[18px] text-ink">
                        {c.amount}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink-soft">{c.sub}</p>
                  </article>
                ))}
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-paper border border-ink rounded-3xl p-6 lg:p-8 shadow-pop max-w-md mx-4 text-center">
                  <p className="text-3xl mb-2">🔒</p>
                  <h2 className="display font-bold text-[18px] text-ink leading-tight">
                    {typeof total === "number" && total > 0
                      ? `${total} 件のリアルな年収データ`
                      : "リアルな年収データ"}
                  </h2>
                  <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
                    あなたのデータを<b>匿名</b>で投稿すると、他のメンバーの
                    実数(年収・家賃・貯蓄率・ビザ・満足度)がすべて見られる
                    ようになります。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push(
                          `/login?next=${encodeURIComponent("/salaries")}`,
                        );
                        return;
                      }
                      setShowForm(true);
                    }}
                    className="btn-primary mt-4 px-6"
                  >
                    {isLoggedIn
                      ? "匿名で投稿して解放する →"
                      : "ログインして始める →"}
                  </button>
                  <p className="text-[10px] text-ink-faint mt-3">
                    レンジ選択のみ・約 2 分・名前とは紐付きません
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Unlocked: filters + entries */}
          {unlocked && !showForm && (
            <>
              <section className="bg-paper border border-ink rounded-2xl p-3 lg:p-4 shadow-pop-sm">
                <div className="grid grid-cols-3 gap-2">
                  <FilterSelect
                    label="国"
                    value={filters.country}
                    onChange={(v) => setFilter("country", v)}
                    options={COUNTRY_OPTS.filter((o) => o.v)}
                  />
                  <FilterSelect
                    label="業界"
                    value={filters.industry}
                    onChange={(v) => setFilter("industry", v)}
                    options={INDUSTRY_OPTS.filter((o) => o.v)}
                  />
                  <FilterSelect
                    label="職種"
                    value={filters.role}
                    onChange={(v) => setFilter("role", v)}
                    options={ROLE_OPTS.filter((o) => o.v)}
                  />
                </div>
                <p className="text-[11px] text-ink-soft font-bold mt-3 pt-3 border-t border-dashed border-ink/15">
                  {entries.length} 件のデータ
                </p>
              </section>

              <section className="space-y-2">
                {entries.length === 0 ? (
                  <div className="bg-paper border border-ink rounded-2xl p-6 text-center shadow-pop-sm">
                    <p className="text-2xl mb-1">🔍</p>
                    <p className="display font-bold text-[14px] text-ink">
                      この条件のデータはまだありません
                    </p>
                    <p className="text-[11px] text-ink-soft mt-1">
                      フィルタを広げるか、仲間にシェアしてデータを増やしましょう。
                    </p>
                  </div>
                ) : (
                  entries.map((e) => (
                    <EntryCard
                      key={e.entry_id}
                      entry={e}
                      premium={premium}
                      onOpen={() => setSelected(e)}
                    />
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Entry detail */}
      <div
        className={`modal-overlay ${selected ? "open" : ""}`}
        onClick={() => setSelected(null)}
      />
      <div className={`modal-sheet ${selected ? "open" : ""}`}>
        {selected && (
          <EntryDetail
            entry={selected}
            premium={premium}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <BottomNavMobile active="salaries" />
    </>
  );
}

/** Masked range — shows the real label only to premium members. */
function Amount({ label, premium }: { label: string; premium: boolean }) {
  if (premium) return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span
        className="blur-[5px] select-none text-ink-soft"
        aria-hidden
      >
        {label}
      </span>
      <span className="text-[10px]">🔒</span>
    </span>
  );
}

const PLACEHOLDER_CARDS = [
  {
    head: "🇸🇬 Singapore · Tech · Engineer",
    amount: "1,300〜1,600万円",
    sub: "家賃 20〜30万 · 貯蓄率 30〜50% · EP · WLB ★★★★",
  },
  {
    head: "🇺🇸 United States · Startup · PM",
    amount: "1,600〜2,000万円",
    sub: "家賃 30〜45万 · 貯蓄率 20〜30% · H-1B · WLB ★★★",
  },
  {
    head: "🇹🇭 Thailand · Consumer · BD",
    amount: "800〜1,000万円",
    sub: "家賃 〜10万 · 貯蓄率 30〜50% · 就労ビザ · WLB ★★★★★",
  },
  {
    head: "🇩🇪 Germany · Tech · Designer",
    amount: "1,000〜1,300万円",
    sub: "家賃 10〜20万 · 貯蓄率 10〜20% · EU Blue Card · WLB ★★★★",
  },
];

function EntryCard({
  entry,
  premium,
  onOpen,
}: {
  entry: CompEntry;
  premium: boolean;
  onOpen: () => void;
}) {
  const flag = entry.country ? (COUNTRY_FLAGS[entry.country] ?? "🌏") : "🌏";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-cream border border-ink/20 hover:border-ink rounded-2xl p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[13px] text-ink truncate">
            {flag} {entry.country ?? "—"}
            {entry.city ? ` · ${entry.city}` : ""}
          </p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            {labelOf(INDUSTRY_OPTS, entry.industry)} ·{" "}
            {labelOf(ROLE_OPTS, entry.role)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="display font-bold text-[20px] text-ink leading-none">
            <Amount
              label={labelOf(JPY_SALARY_OPTS, entry.total_comp_range)}
              premium={premium}
            />
          </p>
          <p className="text-[9px] uppercase tracking-wider text-ink-faint font-bold mt-1">
            年収(総額)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {entry.base_salary_range &&
          (premium ? (
            <Chip label={`基本給 ${labelOf(JPY_SALARY_OPTS, entry.base_salary_range)}`} />
          ) : (
            <Chip label="基本給 🔒" />
          ))}
        {entry.has_equity && <Chip label="📈 株式あり" accent />}
        {entry.monthly_rent_range && (
          <Chip label={`🏠 家賃 ${labelOf(RENT_OPTS, entry.monthly_rent_range)}`} />
        )}
        {entry.savings_rate_range && (
          <Chip
            label={`💰 貯蓄率 ${labelOf(SAVINGS_RATE_OPTS, entry.savings_rate_range)}`}
          />
        )}
        {entry.visa_type && (
          <Chip label={`🛂 ${labelOf(VISA_OPTS, entry.visa_type)}`} />
        )}
        {entry.has_pr && <Chip label="永住権あり" accent />}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-dashed border-ink/15">
        {entry.wlb_satisfaction != null && (
          <Meter label="WLB" value={entry.wlb_satisfaction} max={5} />
        )}
        {entry.life_satisfaction != null && (
          <Meter label="生活満足度" value={entry.life_satisfaction} max={10} />
        )}
        <span className="text-[10px] text-blue font-bold ml-auto whitespace-nowrap">
          詳細 →
        </span>
      </div>
    </button>
  );
}

function EntryDetail({
  entry,
  premium,
  onClose,
}: {
  entry: CompEntry;
  premium: boolean;
  onClose: () => void;
}) {
  const flag = entry.country ? (COUNTRY_FLAGS[entry.country] ?? "🌏") : "🌏";
  return (
    <div className="px-5 pt-2">
      <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4" />
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
            年収データ詳細
          </p>
          <h3 className="display font-bold text-[18px] text-ink mt-1 leading-tight">
            {flag} {entry.country ?? "—"}
            {entry.city ? ` · ${entry.city}` : ""}
          </h3>
          <p className="text-[12px] text-ink-soft mt-0.5">
            {labelOf(INDUSTRY_OPTS, entry.industry)} ·{" "}
            {labelOf(ROLE_OPTS, entry.role)} · {entry.reported_month}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink flex-shrink-0"
          aria-label="閉じる"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="pb-6 space-y-4">
        {/* 報酬 (premium-gated numbers) */}
        <div className="bg-cream border border-ink rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mb-2">
            💴 報酬
          </p>
          <div className="space-y-1.5">
            <DetailRow
              label="年収(総額)"
              value={
                <Amount
                  label={labelOf(JPY_SALARY_OPTS, entry.total_comp_range)}
                  premium={premium}
                />
              }
              strong
            />
            {entry.base_salary_range && (
              <DetailRow
                label="基本給"
                value={
                  <Amount
                    label={labelOf(JPY_SALARY_OPTS, entry.base_salary_range)}
                    premium={premium}
                  />
                }
              />
            )}
            {entry.bonus_range && (
              <DetailRow
                label="ボーナス"
                value={
                  <Amount label={BONUS_LABELS[entry.bonus_range] ?? entry.bonus_range} premium={premium} />
                }
              />
            )}
            {entry.has_equity != null && (
              <DetailRow
                label="株式報酬"
                value={entry.has_equity ? "あり" : "なし"}
              />
            )}
          </div>
        </div>

        {/* 生活 */}
        <div className="bg-cream border border-ink/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mb-2">
            🏠 生活・働き方
          </p>
          <div className="space-y-1.5">
            {entry.monthly_rent_range && (
              <DetailRow
                label="家賃 / 月"
                value={labelOf(RENT_OPTS, entry.monthly_rent_range)}
              />
            )}
            {entry.savings_rate_range && (
              <DetailRow
                label="貯蓄率"
                value={labelOf(SAVINGS_RATE_OPTS, entry.savings_rate_range)}
              />
            )}
            {entry.weekly_hours_range && (
              <DetailRow
                label="週あたり労働時間"
                value={labelOf(WEEKLY_HOURS_OPTS, entry.weekly_hours_range)}
              />
            )}
            {entry.remote_frequency && (
              <DetailRow
                label="リモート頻度"
                value={labelOf(REMOTE_FREQ_OPTS, entry.remote_frequency)}
              />
            )}
            {entry.english_usage_rate && (
              <DetailRow
                label="英語使用率"
                value={labelOf(ENGLISH_USAGE_OPTS, entry.english_usage_rate)}
              />
            )}
          </div>
        </div>

        {/* ビザ・満足度 */}
        <div className="bg-cream border border-ink/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mb-2">
            🛂 ビザ・満足度
          </p>
          <div className="space-y-1.5">
            {entry.visa_type && (
              <DetailRow label="ビザ" value={labelOf(VISA_OPTS, entry.visa_type)} />
            )}
            {entry.has_pr != null && (
              <DetailRow label="永住権" value={entry.has_pr ? "あり" : "なし"} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-dashed border-ink/15">
            {entry.wlb_satisfaction != null && (
              <Meter label="WLB" value={entry.wlb_satisfaction} max={5} />
            )}
            {entry.life_satisfaction != null && (
              <Meter label="生活満足度" value={entry.life_satisfaction} max={10} />
            )}
            {entry.overseas_satisfaction != null && (
              <Meter
                label="移住満足度"
                value={entry.overseas_satisfaction}
                max={10}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-ink-soft">{label}</span>
      <span
        className={`text-ink ${strong ? "display font-bold text-[16px]" : "text-[12px] font-bold"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
        accent
          ? "bg-jade/20 text-jade-deep border-jade/40"
          : "bg-paper text-ink-soft border-ink/15"
      }`}
    >
      {label}
    </span>
  );
}

function Meter({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-wider text-ink-faint font-bold">
        {label}
      </span>
      <div className="w-12 h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue rounded-full"
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-ink">
        {value}/{max}
      </span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase tracking-[0.2em] text-ink-faint font-bold block mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`filter-select !py-2 !text-[12px] ${value ? "filled" : ""}`}
      >
        <option value="">すべて</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
