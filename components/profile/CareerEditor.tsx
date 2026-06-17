"use client";

import {
  COMPANY_SUGGESTIONS,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  type CareerStep,
} from "@/lib/profile/store";
import {
  COUNTRY_OPTS,
  INDUSTRY_OPTS,
  JPY_SALARY_OPTS,
  ROLE_OPTS,
} from "@/lib/profile/options";

/**
 * Shared career-timeline editor pieces, extracted from MyPageClient so the
 * onboarding wizard (/welcome) and the mypage edit modal render the exact
 * same form. State lives in the parent — every row is driven by props.
 */

export const BLANK_CAREER_STEP: Omit<CareerStep, "id"> = {
  country: "",
  company: "",
  industry: "",
  role: "",
  salary: "",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  achievements: "",
  current: false,
};

export function freshStep(overrides: Partial<CareerStep> = {}): CareerStep {
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...BLANK_CAREER_STEP,
    ...overrides,
  };
}

/** A career step is "valid" once it carries the required core fields. */
export function isCareerStepValid(step: CareerStep): boolean {
  return (
    step.company.trim().length > 0 &&
    step.country.length > 0 &&
    step.role.length > 0 &&
    step.startYear.length > 0
  );
}

export function Field({
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

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`filter-select !py-2 !text-[13px] ${value ? "filled" : ""}`}
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ─────────── Career editor row (inline, multiple at once) ─────────── */

export function CareerEditorRow({
  step,
  index,
  onChange,
  onRemove,
}: {
  step: CareerStep;
  index: number;
  onChange: (patch: Partial<CareerStep>) => void;
  onRemove: () => void;
}) {
  const endDisabled = step.current;
  return (
    <div className="bg-cream border border-ink/15 rounded-2xl p-3 lg:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold">
          #{index}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] text-plum font-bold"
        >
          削除
        </button>
      </div>
      <Field label="企業名 *">
        <input
          type="text"
          className="field"
          placeholder="例: Shopee"
          list="career-company-suggestions"
          value={step.company}
          onChange={(e) => onChange({ company: e.target.value })}
        />
        <datalist id="career-company-suggestions">
          {COMPANY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Field label="国 *">
          <Select
            value={step.country}
            onChange={(v) => onChange({ country: v })}
            options={COUNTRY_OPTS}
          />
        </Field>
        <Field label="業界">
          <Select
            value={step.industry}
            onChange={(v) => onChange({ industry: v })}
            options={INDUSTRY_OPTS}
          />
        </Field>
        <Field label="職種 *">
          <Select
            value={step.role}
            onChange={(v) => onChange({ role: v })}
            options={ROLE_OPTS}
          />
        </Field>
      </div>
      <Field label="年収レンジ (任意)">
        <Select
          value={step.salary}
          onChange={(v) => onChange({ salary: v })}
          options={JPY_SALARY_OPTS}
        />
      </Field>
      <Field label="期間 (開始年は必須)">
        <div className="grid grid-cols-5 items-center gap-1.5">
          <Select
            value={step.startYear}
            onChange={(v) => onChange({ startYear: v })}
            options={[
              { v: "", label: "年" },
              ...YEAR_OPTIONS.map((y) => ({ v: y, label: y })),
            ]}
          />
          <Select
            value={step.startMonth}
            onChange={(v) => onChange({ startMonth: v })}
            options={[
              { v: "", label: "月" },
              ...MONTH_OPTIONS.map((m) => ({ v: m, label: m })),
            ]}
          />
          <span className="text-center text-ink-faint font-bold">〜</span>
          {endDisabled ? (
            <div className="col-span-2 text-center text-[12px] font-bold text-blue py-2 bg-blue-soft border border-blue/30 rounded-xl">
              現在
            </div>
          ) : (
            <>
              <Select
                value={step.endYear}
                onChange={(v) => onChange({ endYear: v })}
                options={[
                  { v: "", label: "年" },
                  ...YEAR_OPTIONS.map((y) => ({ v: y, label: y })),
                ]}
              />
              <Select
                value={step.endMonth}
                onChange={(v) => onChange({ endMonth: v })}
                options={[
                  { v: "", label: "月" },
                  ...MONTH_OPTIONS.map((m) => ({ v: m, label: m })),
                ]}
              />
            </>
          )}
        </div>
        <label className="flex items-center gap-2 mt-2 text-[12px] text-ink-soft cursor-pointer">
          <input
            type="checkbox"
            checked={step.current}
            onChange={(e) => onChange({ current: e.target.checked })}
            className="w-4 h-4 accent-blue"
          />
          現在も在籍中(チェックすると終了年月が無効になり「現在」と表示)
        </label>
      </Field>
      <Field label="実績・担当業務 (任意)">
        <textarea
          className="field"
          rows={3}
          placeholder="例: 映像機器のグローバル展開を担当。最後の1年でアジア市場の責任者へ。"
          value={step.achievements}
          onChange={(e) => onChange({ achievements: e.target.value })}
        />
      </Field>
    </div>
  );
}
