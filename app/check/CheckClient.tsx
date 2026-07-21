"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { ShareButtons } from "@/components/site/ShareButtons";
import { freshStep } from "@/components/profile/CareerEditor";
import { careerLevel } from "@/lib/profile/level";
import { useProfile, type CareerStep, type Profile } from "@/lib/profile/store";
import { syncProfileBasics } from "@/app/mypage/actions";
import { track } from "@/lib/analytics/track";
import { findCountryByDb } from "@/lib/seo/salaryPages";
import { countTargetCountry } from "./actions";
import {
  bandOf,
  DIM_LABEL,
  FIELD_QUESTIONS,
  SCORED_QUESTIONS,
  scoreOf,
  weakestDims,
  type Question,
} from "./quiz";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xbordercareer.com";

const ALL_QUESTIONS: { q: Question; fieldKey?: string }[] = [
  ...FIELD_QUESTIONS.map((f) => ({ q: f.q, fieldKey: f.key })),
  ...SCORED_QUESTIONS.map((q) => ({ q })),
];

export function CheckClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useProfile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [company, setCompany] = useState("");
  const [done, setDone] = useState(false);
  const [levelInfo, setLevelInfo] = useState<{ before: number; after: number } | null>(null);
  const [targetN, setTargetN] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const total = ALL_QUESTIONS.length;
  const current = ALL_QUESTIONS[step];
  const answeredCurrent = current ? !!answers[current.q.id] : true;

  function pick(qid: string, v: string) {
    setAnswers((a) => ({ ...a, [qid]: v }));
    // Auto-advance after a short beat for a snappy quiz feel.
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, total));
    }, 180);
  }

  function buildMergedProfile(): { merged: Profile; before: number; after: number } {
    const cur = profile;
    const currentCountry = answers.cc || "";
    const currentIndustry = answers.ci || "";
    const currentRole = answers.cr || "";
    const currentSalary = answers.cs || "";
    const goalCountry = answers.gc || "";
    const goalRoleRaw = answers.gr || "";
    const goalRole = goalRoleRaw === "__same" ? currentRole : goalRoleRaw;

    // Only fill fields that are currently empty — never clobber richer data.
    const fill = (existing: string, next: string) =>
      existing && existing.trim() ? existing : next;

    // Current position as a career entry (drives level + /search company).
    const career: CareerStep[] = cur.career.map((s) => ({ ...s }));
    const hasCurrentEntry = career.some((s) => s.current);
    const wantEntry =
      currentCountry || currentRole || currentIndustry || company.trim();
    if (wantEntry && !hasCurrentEntry) {
      career.unshift(
        freshStep({
          country: currentCountry,
          company: company.trim(),
          industry: currentIndustry,
          role: currentRole,
          salary: currentSalary,
          current: true,
        }),
      );
    } else if (wantEntry && hasCurrentEntry) {
      // Enrich the existing current entry's empty fields only.
      const idx = career.findIndex((s) => s.current);
      const e = career[idx]!;
      career[idx] = {
        ...e,
        country: fill(e.country, currentCountry),
        company: fill(e.company, company.trim()),
        industry: fill(e.industry, currentIndustry),
        role: fill(e.role, currentRole),
        salary: fill(e.salary, currentSalary),
      };
    }

    const merged: Profile = {
      ...cur,
      country: fill(cur.country, currentCountry),
      industry: fill(cur.industry, currentIndustry),
      role: fill(cur.role, currentRole),
      salary: fill(cur.salary, currentSalary),
      goalCountry: fill(cur.goalCountry, goalCountry),
      goalRole: fill(cur.goalRole, goalRole),
      career,
    };
    return { merged, before: careerLevel(cur.career), after: careerLevel(career) };
  }

  function finish() {
    const { merged, before, after } = buildMergedProfile();
    // Persist locally always (survives signup on this browser); persist to
    // the DB when signed in so it reaches /search and every device.
    setProfile(merged);
    if (isLoggedIn) {
      startTransition(() => {
        void syncProfileBasics(merged);
      });
    }
    setLevelInfo({ before, after });
    track("check_complete", {
      score: scoreOf(answers),
      goal_country: answers.gc || null,
      logged_in: isLoggedIn,
    });
    // Target-country dataset size for social proof.
    if (answers.gc) {
      void countTargetCountry(answers.gc).then(setTargetN);
    }
    setDone(true);
  }

  const score = useMemo(() => scoreOf(answers), [answers]);
  const band = bandOf(score);
  const gaps = useMemo(() => weakestDims(answers), [answers]);

  // ---- Result screen ----
  if (done) {
    const goal = findCountryByDb(answers.gc || "");
    const shareUrl = `${BASE}/check`;
    const shareText = `海外転職 準備度チェックの結果は ${score}/100(${band.label})でした。あなたの準備度も1分でわかります👇 #XBorderHub`;
    return (
      <>
        <AppTopBar />
        <main className="container-app py-6 lg:py-10 pb-24 lg:pb-10">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="bg-ink text-cream rounded-3xl p-6 text-center shadow-pop">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cream/70 font-bold">
                海外転職 準備度
              </p>
              <p className="display font-bold text-[56px] leading-none text-mustard mt-2">
                {score}
                <span className="text-[24px] text-cream/60"> / 100</span>
              </p>
              <p className={`display font-bold text-[18px] mt-1 text-cream`}>
                {band.label}
              </p>
            </div>

            {/* Reflected to profile */}
            <div className="bg-paper border border-ink/10 rounded-2xl p-4">
              <p className="text-[12px] font-bold text-ink mb-2">
                ✓ 回答をプロフィールに反映しました
              </p>
              <ul className="text-[12px] text-ink-soft space-y-1 leading-relaxed">
                {answers.cc && <li>・現在地: {labelOfField("cc", answers.cc)}</li>}
                {answers.ci && <li>・業界: {labelOfField("ci", answers.ci)}</li>}
                {answers.cr && <li>・職種: {labelOfField("cr", answers.cr)}</li>}
                {answers.gc && <li>・目標の国: {labelOfField("gc", answers.gc)}</li>}
              </ul>
              {levelInfo && (
                <p className="text-[12px] font-bold text-ink mt-2">
                  プロフィール Lv.{levelInfo.after}
                  {levelInfo.after > levelInfo.before && (
                    <span className="text-jade-deep"> ↑ レベルアップ!</span>
                  )}
                </p>
              )}
              {!isLoggedIn && (
                <p className="text-[11px] text-ink-faint mt-2 leading-relaxed">
                  登録すると結果が保存され、検索であなたが表示されるようになります。
                </p>
              )}
            </div>

            {/* Gaps / advice */}
            <div className="bg-cream border border-ink/10 rounded-2xl p-4">
              <p className="text-[12px] font-bold text-ink mb-1.5">
                次に強化すると効果的なポイント
              </p>
              <div className="flex gap-2 flex-wrap">
                {gaps.map((d) => (
                  <span
                    key={d}
                    className="text-[11px] font-bold text-ink bg-paper border border-ink/15 rounded-full px-3 py-1"
                  >
                    {DIM_LABEL[d]}
                  </span>
                ))}
              </div>
            </div>

            {/* Social proof + CTA */}
            {goal && (
              <div className="bg-blue-soft/20 border border-blue/20 rounded-2xl p-4">
                <p className="text-[13px] text-ink leading-relaxed">
                  {goal.flag} <b>{goal.ja}</b> には実データ
                  <b> {targetN ?? "—"} 件</b>
                  と、実際に働く日本人メンバーがいます。年収・ビザ・生活を直接聞けます。
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Link
                    href={`/salaries/${goal.slug}`}
                    className="bg-ink text-cream font-bold text-[12px] px-4 py-2 rounded-full"
                  >
                    {goal.ja}の年収を見る →
                  </Link>
                  <Link
                    href="/search"
                    className="bg-cream border border-ink/15 text-ink font-bold text-[12px] px-4 py-2 rounded-full"
                  >
                    メンバーを探す →
                  </Link>
                </div>
              </div>
            )}

            {!isLoggedIn && (
              <Link
                href={`/login?next=${encodeURIComponent("/home")}`}
                className="block text-center bg-ink text-cream font-bold text-[14px] py-3 rounded-full"
              >
                無料登録して結果を保存 →
              </Link>
            )}

            <div className="text-center">
              <p className="text-[11px] text-ink-soft font-bold mb-2">
                友だちの準備度も測ってみよう
              </p>
              <div className="flex justify-center">
                <ShareButtons url={shareUrl} text={shareText} source="check_result" />
              </div>
              <p className="text-[10px] text-ink-faint mt-2">
                <a
                  href={`/og/check?score=${score}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  シェア画像をプレビュー
                </a>
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ---- Quiz screen ----
  const onLast = step >= total;
  return (
    <>
      <AppTopBar />
      <main className="container-app py-6 lg:py-10 pb-24 lg:pb-10">
        <div className="max-w-lg mx-auto space-y-5">
          <header className="text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
              🧭 diagnostic
            </p>
            <h1 className="display font-bold text-[24px] sm:text-[28px] leading-tight text-ink mt-1">
              海外転職 準備度チェック
            </h1>
            <p className="text-[12px] text-ink-soft mt-1">
              1分・{total}問。回答はあなたのプロフィールに反映されます。
            </p>
          </header>

          {/* Progress */}
          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue rounded-full transition-all"
              style={{ width: `${(Math.min(step, total) / total) * 100}%` }}
            />
          </div>

          {!onLast && current && (
            <div className="bg-paper border border-ink/10 rounded-2xl p-5 shadow-pop-sm">
              <p className="text-[10px] font-bold text-ink-faint mb-1">
                {step + 1} / {total}
              </p>
              <h2 className="display font-bold text-[17px] text-ink leading-snug">
                {current.q.title}
              </h2>
              {current.q.hint && (
                <p className="text-[11px] text-ink-faint mt-1">{current.q.hint}</p>
              )}
              <div className="flex gap-2 flex-wrap mt-4">
                {current.q.choices.map((c) => {
                  const active = answers[current.q.id] === c.v;
                  return (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => pick(current.q.id, c.v)}
                      className={`text-[12px] font-bold px-3.5 py-2 rounded-full border transition-colors ${
                        active
                          ? "bg-ink text-cream border-ink"
                          : "bg-cream text-ink border-ink/15 hover:border-ink"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-[11px] text-ink-soft font-bold mt-4 underline"
                >
                  ← 戻る
                </button>
              )}
            </div>
          )}

          {onLast && (
            <div className="bg-paper border border-ink/10 rounded-2xl p-5 shadow-pop-sm space-y-4">
              <div>
                <h2 className="display font-bold text-[17px] text-ink">
                  今の会社名(任意)
                </h2>
                <p className="text-[11px] text-ink-faint mt-1">
                  入力すると経歴に追加され、検索であなたのキャリアが表示されます。
                  非公開設定にすれば他者には見えません。
                </p>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={80}
                  placeholder="例: ○○株式会社(空欄でもOK)"
                  className="field w-full mt-3"
                />
              </div>
              <button
                type="button"
                onClick={finish}
                className="w-full bg-ink text-cream font-bold text-[14px] py-3 rounded-full"
              >
                結果を見る →
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="block mx-auto text-[11px] text-ink-soft font-bold underline"
              >
                ← 戻る
              </button>
            </div>
          )}

          {!answeredCurrent && !onLast && (
            <p className="text-center text-[11px] text-ink-faint">
              選択すると次の質問に進みます
            </p>
          )}
        </div>
      </main>
    </>
  );
}

/** Resolve a field-question choice value back to its display label. */
function labelOfField(qid: string, v: string): string {
  const f = FIELD_QUESTIONS.find((x) => x.q.id === qid);
  return f?.q.choices.find((c) => c.v === v)?.label ?? v;
}
