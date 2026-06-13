"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
} from "@/lib/profile/options";
import type { CompensationData } from "@/lib/supabase/database.types";
import { submitCompensation } from "@/lib/compensation/actions";
import { track } from "@/lib/analytics/track";

export function ContributeForm({
  own,
  defaults,
  onDone,
  onCancel,
}: {
  /** Existing row when editing; null on first contribution. */
  own: CompensationData | null;
  defaults: { country: string; city: string; industry: string; role: string };
  onDone: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [country, setCountry] = useState(own?.country ?? defaults.country);
  const [city, setCity] = useState(own?.city ?? defaults.city);
  const [industry, setIndustry] = useState(own?.industry ?? defaults.industry);
  const [role, setRole] = useState(own?.role ?? defaults.role);

  const [baseSalary, setBaseSalary] = useState(own?.base_salary_range ?? "");
  const [bonus, setBonus] = useState(own?.bonus_range ?? "");
  const [hasEquity, setHasEquity] = useState<boolean>(own?.has_equity ?? false);
  const [totalComp, setTotalComp] = useState(own?.total_comp_range ?? "");

  const [rent, setRent] = useState(own?.monthly_rent_range ?? "");
  const [savingsRate, setSavingsRate] = useState(
    own?.savings_rate_range ?? "",
  );
  const [lifeSat, setLifeSat] = useState<number>(own?.life_satisfaction ?? 0);

  const [weeklyHours, setWeeklyHours] = useState(
    own?.weekly_hours_range ?? "",
  );
  const [remoteFreq, setRemoteFreq] = useState(own?.remote_frequency ?? "");
  const [englishUsage, setEnglishUsage] = useState(
    own?.english_usage_rate ?? "",
  );
  const [wlbSat, setWlbSat] = useState<number>(own?.wlb_satisfaction ?? 0);

  const [visaType, setVisaType] = useState(own?.visa_type ?? "");
  const [hasPr, setHasPr] = useState<boolean>(own?.has_pr ?? false);
  const [overseasSat, setOverseasSat] = useState<number>(
    own?.overseas_satisfaction ?? 0,
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = Boolean(country && industry && role && totalComp);

  function submit() {
    if (!valid || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submitCompensation({
        country,
        city,
        industry,
        role,
        base_salary_range: baseSalary,
        bonus_range: bonus,
        has_equity: hasEquity,
        total_comp_range: totalComp,
        monthly_rent_range: rent,
        savings_rate_range: savingsRate,
        life_satisfaction: lifeSat || null,
        weekly_hours_range: weeklyHours,
        remote_frequency: remoteFreq,
        english_usage_rate: englishUsage,
        wlb_satisfaction: wlbSat || null,
        visa_type: visaType,
        has_pr: hasPr,
        overseas_satisfaction: overseasSat || null,
      });
      if (res.ok) {
        track("comp_contribution", { country, industry, role });
        onDone();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="bg-paper border border-ink rounded-3xl p-5 lg:p-7 shadow-pop">
      <h2 className="display font-bold text-[20px] text-ink leading-tight">
        {own ? "あなたのデータを編集" : "あなたのデータを投稿"}
      </h2>
      <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed">
        すべて<b>匿名</b>で公開されます(名前・プロフィールとは紐付きません)。
        レンジ選択のみで、具体的な金額は収集しません。
      </p>

      {/* 基本 */}
      <Section title="📍 ポジション(必須)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="国 *">
            <select
              className="filter-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRY_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="都市(任意)">
            <input
              type="text"
              className="field"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例: Singapore"
            />
          </Field>
          <Field label="業界 *">
            <select
              className="filter-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRY_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="職種 *">
            <select
              className="filter-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLE_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* 報酬 */}
      <Section title="💴 報酬">
        <div className="grid grid-cols-2 gap-3">
          <Field label="年収(総額・円換算)*">
            <select
              className="filter-select"
              value={totalComp}
              onChange={(e) => setTotalComp(e.target.value)}
            >
              {JPY_SALARY_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="基本給">
            <select
              className="filter-select"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            >
              {JPY_SALARY_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ボーナス">
            <select
              className="filter-select"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            >
              <option value="">—</option>
              <option value="none">なし</option>
              <option value="lt_1m">〜1ヶ月分</option>
              <option value="1_3m">1〜3ヶ月分</option>
              <option value="3_6m">3〜6ヶ月分</option>
              <option value="gte_6m">6ヶ月分以上</option>
            </select>
          </Field>
          <Field label="株式報酬 (RSU / SO)">
            <Toggle
              value={hasEquity}
              onChange={setHasEquity}
              labels={["なし", "あり"]}
            />
          </Field>
        </div>
      </Section>

      {/* 生活 */}
      <Section title="🏠 生活">
        <div className="grid grid-cols-2 gap-3">
          <Field label="家賃 / 月(円換算)">
            <select
              className="filter-select"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            >
              {RENT_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="貯蓄率">
            <select
              className="filter-select"
              value={savingsRate}
              onChange={(e) => setSavingsRate(e.target.value)}
            >
              {SAVINGS_RATE_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="週あたり労働時間">
            <select
              className="filter-select"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
            >
              {WEEKLY_HOURS_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="リモート頻度">
            <select
              className="filter-select"
              value={remoteFreq}
              onChange={(e) => setRemoteFreq(e.target.value)}
            >
              {REMOTE_FREQ_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="英語使用率">
            <select
              className="filter-select"
              value={englishUsage}
              onChange={(e) => setEnglishUsage(e.target.value)}
            >
              {ENGLISH_USAGE_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field label="生活満足度(1〜10)">
            <RatingRow max={10} value={lifeSat} onChange={setLifeSat} />
          </Field>
          <Field label="ワークライフバランス(1〜5)">
            <RatingRow max={5} value={wlbSat} onChange={setWlbSat} />
          </Field>
        </div>
      </Section>

      {/* ビザ */}
      <Section title="🛂 ビザ・満足度">
        <div className="grid grid-cols-2 gap-3">
          <Field label="ビザ">
            <select
              className="filter-select"
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
            >
              {VISA_OPTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="永住権">
            <Toggle
              value={hasPr}
              onChange={setHasPr}
              labels={["なし", "あり"]}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="海外移住の総合満足度(1〜10)">
            <RatingRow max={10} value={overseasSat} onChange={setOverseasSat} />
          </Field>
        </div>
      </Section>

      {error && (
        <p className="text-[11px] font-bold text-red-600 mt-4">{error}</p>
      )}

      <div className="flex items-center justify-between gap-3 mt-6">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-[12px] font-bold text-ink-soft"
          >
            キャンセル
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!valid || pending}
          onClick={submit}
          className={`btn-primary px-8 ${valid && !pending ? "" : "opacity-40 cursor-not-allowed"}`}
        >
          {pending
            ? "保存中…"
            : own
              ? "更新する"
              : "投稿して全データを見る →"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 pt-5 border-t border-dashed border-ink/15 first:border-0">
      <p className="text-[11px] font-bold text-ink mb-3">{title}</p>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  value,
  onChange,
  labels,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels: [string, string];
}) {
  return (
    <div className="inline-flex gap-0.5 p-0.5 bg-cream border border-ink/15 rounded-lg w-full">
      {[false, true].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 px-2 py-2 rounded text-[12px] font-bold transition-colors ${
            value === v ? "bg-ink text-cream" : "text-ink-soft"
          }`}
        >
          {labels[v ? 1 : 0]}
        </button>
      ))}
    </div>
  );
}

function RatingRow({
  max,
  value,
  onChange,
}: {
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className={`w-8 h-8 rounded-lg border text-[11px] font-bold transition-colors ${
            n <= value
              ? "bg-blue text-cream border-blue"
              : "bg-cream text-ink-soft border-ink/15"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
