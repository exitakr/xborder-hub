"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/site/LogoMark";
import { useProfile, type CareerStep } from "@/lib/profile/store";
import {
  COUNTRY_OPTS,
  INDUSTRY_OPTS,
  ROLE_OPTS,
} from "@/lib/profile/options";
import {
  CareerEditorRow,
  freshStep,
  isCareerStepValid,
} from "@/components/profile/CareerEditor";
import { track } from "@/lib/analytics/track";
import { completeOnboarding } from "./actions";

const STEPS = ["お名前", "あなたの移動", "仕事", "歩んできた軌跡"] as const;
const CAREER_STEP = 3;

export function WelcomeClient({ next }: { next?: string }) {
  const router = useRouter();
  const [, setLocalProfile] = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [fromCountry, setFromCountry] = useState("Japan");
  const [fromCity, setFromCity] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [allowCc, setAllowCc] = useState(true);
  const [career, setCareer] = useState<CareerStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validCareer = career.filter(isCareerStepValid);
  const canNext = step === 0 ? name.trim().length > 0 : true;
  const canFinish = validCareer.length > 0;

  function advance() {
    setError(null);
    // Seed the first career row when arriving at the career step so the
    // user only has to confirm/adjust — prefilled with their current job.
    if (step + 1 === CAREER_STEP && career.length === 0) {
      setCareer([
        freshStep({
          country: toCountry,
          industry,
          role,
          current: true,
        }),
      ]);
    }
    setStep((s) => s + 1);
  }

  function patchStep(id: string, patch: Partial<CareerStep>) {
    setCareer((list) =>
      list.map((s) => {
        if (s.id !== id) return patch.current ? { ...s, current: false } : s;
        const merged = { ...s, ...patch };
        if (merged.current) {
          merged.endYear = "";
          merged.endMonth = "";
        }
        return merged;
      }),
    );
  }

  function addRow() {
    setCareer((list) => [...list, freshStep()]);
  }

  function removeRow(id: string) {
    setCareer((list) => list.filter((s) => s.id !== id));
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        displayName: name,
        fromCountry,
        fromCity,
        toCountry,
        toCity,
        industry,
        role,
        allowCoffeeChat: allowCc,
        career: validCareer,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      track("signup_completed", {
        from_country: fromCountry,
        to_country: toCountry,
        industry,
        role,
        career_entries: validCareer.length,
      });
      // Seed the local store so AppTopBar / mypage hydrate instantly.
      setLocalProfile((p) => ({
        ...p,
        name: name.replace(/(さん|くん|さま|様)\s*$/, "").trim(),
        fromCountry: fromCountry || p.fromCountry,
        fromCity: fromCity || p.fromCity,
        country: toCountry || p.country,
        city: toCity || p.city,
        industry: industry || p.industry,
        role: role || p.role,
        ccAvailable: allowCc,
        career: validCareer.map((s) => ({ ...s })),
      }));
      router.replace(next && next.startsWith("/") ? next : "/home");
    });
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <LogoMark />
          <div className="display font-bold text-[15px] tracking-tight text-ink">
            X Border Hub
          </div>
        </div>

        <div className="bg-paper border border-ink rounded-3xl p-6 lg:p-8 shadow-pop">
          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full ${i <= step ? "bg-blue" : "bg-ink/10"}`}
                />
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold mt-1.5 ${
                    i <= step ? "text-blue" : "text-ink-faint"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {step === 0 && (
            <section>
              <h1 className="display font-bold text-[22px] text-ink leading-tight">
                ようこそ。
                <br />
                お名前を教えてください
              </h1>
              <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
                スレッドやコメントに表示される名前です。本名でもニックネームでも構いません。
              </p>
              <div className="mt-5">
                <label className="label" htmlFor="wname">
                  表示名 *
                </label>
                <input
                  id="wname"
                  type="text"
                  className="field"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: Taro / 山田太郎 / TY"
                  autoFocus
                />
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <h1 className="display font-bold text-[22px] text-ink leading-tight">
                あなたの移動を教えてください
              </h1>
              <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
                どこからどこへ。まだ移動前なら、行きたい国を選んでください(任意)。
              </p>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">From · 国</label>
                    <select
                      className="filter-select"
                      value={fromCountry}
                      onChange={(e) => setFromCountry(e.target.value)}
                    >
                      {COUNTRY_OPTS.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">From · 都市(任意)</label>
                    <input
                      type="text"
                      className="field"
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      placeholder="例: Tokyo"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">To · 国</label>
                    <select
                      className="filter-select"
                      value={toCountry}
                      onChange={(e) => setToCountry(e.target.value)}
                    >
                      {COUNTRY_OPTS.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">To · 都市(任意)</label>
                    <input
                      type="text"
                      className="field"
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      placeholder="例: Singapore"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h1 className="display font-bold text-[22px] text-ink leading-tight">
                仕事について
              </h1>
              <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
                同じ業界・職種の人とつながりやすくなります(任意)。
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="label">業界</label>
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
                </div>
                <div>
                  <label className="label">職種</label>
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
                </div>
                <label className="flex items-start gap-3 bg-cream border border-ink/15 rounded-2xl p-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCc}
                    onChange={(e) => setAllowCc(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-[13px] font-bold text-ink">
                      ☕ Coffee Chat を受け付ける
                    </span>
                    <span className="block text-[11px] text-ink-soft mt-0.5 leading-relaxed">
                      あなたの経験を聞きたい人からの申請を受け取ります。いつでもマイページで変更できます。
                    </span>
                  </span>
                </label>
              </div>
            </section>
          )}

          {step === CAREER_STEP && (
            <section>
              <h1 className="display font-bold text-[22px] text-ink leading-tight">
                歩んできた軌跡
              </h1>
              <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
                あなたのキャリアの変遷を残してください。経歴があると、同じ道を
                歩む人にあなたが見つけてもらえます。
                <span className="text-ink font-bold">
                  {" "}最低 1 社(企業名・国・職種・開始年)は必須です。
                </span>
              </p>
              <div className="mt-5 space-y-3">
                {career.map((s, i) => (
                  <CareerEditorRow
                    key={s.id}
                    step={s}
                    index={i + 1}
                    onChange={(patch) => patchStep(s.id, patch)}
                    onRemove={() => removeRow(s.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={addRow}
                  className="w-full py-2.5 border border-dashed border-ink/30 rounded-2xl text-[12px] font-bold text-ink-soft hover:border-ink hover:text-ink transition-colors"
                >
                  + 経歴を追加
                </button>
                {!canFinish && (
                  <p className="text-[11px] text-ink-faint">
                    ※ 企業名・国・職種・開始年を入力すると「はじめる」が押せます。
                  </p>
                )}
              </div>
            </section>
          )}

          {error && (
            <p className="text-[11px] font-bold text-red-600 mt-4">{error}</p>
          )}

          <div className="flex items-center justify-between mt-7">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 text-[12px] font-bold text-ink-soft"
              >
                ← 戻る
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={advance}
                className={`btn-primary px-8 ${canNext ? "" : "opacity-40 cursor-not-allowed"}`}
              >
                次へ →
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || !canFinish}
                onClick={finish}
                className={`btn-primary px-8 ${pending || !canFinish ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {pending ? "保存中…" : "はじめる 🎉"}
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-ink-faint text-center mt-4">
          入力した内容はあとからマイページでいつでも変更・追記できます。
        </p>
      </div>
    </main>
  );
}
