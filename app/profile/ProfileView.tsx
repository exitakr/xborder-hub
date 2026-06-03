"use client";

import Link from "next/link";
import { AppHeader } from "@/components/site/AppHeader";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import {
  formatPeriod,
  initials,
  useProfile,
  type CareerStep,
} from "@/lib/profile/store";
import { ConsultApply } from "./ConsultApply";

const COUNTRY_LABEL: Record<string, string> = {
  Japan: "🇯🇵 Japan",
  Singapore: "🇸🇬 Singapore",
  "Hong Kong": "🇭🇰 Hong Kong",
  Thailand: "🇹🇭 Thailand",
  Vietnam: "🇻🇳 Vietnam",
  "United States": "🇺🇸 United States",
  Indonesia: "🇮🇩 Indonesia",
  Malaysia: "🇲🇾 Malaysia",
  "United Kingdom": "🇬🇧 United Kingdom",
  Germany: "🇩🇪 Germany",
  Australia: "🇦🇺 Australia",
};
const INDUSTRY_LABEL: Record<string, string> = {
  Tech: "💻 Tech",
  Finance: "🏦 Finance",
  Startup: "🚀 Startup",
  Consumer: "🛍 Consumer",
  Manufacturing: "🏭 Manufacturing",
  Healthcare: "🏥 Healthcare",
  Education: "🎓 Education",
  Consulting: "📊 Consulting",
};
const ROLE_LABEL: Record<string, string> = {
  "Product Manager": "📐 Product Manager",
  Engineer: "⚙️ Engineer",
  "BD / Sales": "💼 BD / Sales",
  Marketing: "📣 Marketing",
  Designer: "🎨 Designer",
  "Finance / Accounting": "📊 Finance / Accounting",
  "HR / People": "👥 HR / People",
  "Executive (VP+)": "🏛 Executive (VP+)",
  "Founder / Entrepreneur": "🚀 Founder / Entrepreneur",
};
const SALARY_LABEL: Record<string, string> = {
  lt_400: "〜400万円",
  "400_600": "400〜600万円",
  "600_800": "600〜800万円",
  "800_1000": "800〜1,000万円",
  "1000_1300": "1,000〜1,300万円",
  "1300_1600": "1,300〜1,600万円",
  "1600_2000": "1,600〜2,000万円",
  gte_2000: "2,000万円以上",
};

function countryLabel(v: string) {
  return COUNTRY_LABEL[v] ?? v;
}

function shortCity(country: string, city: string) {
  if (city) return city;
  // strip the leading flag emoji from COUNTRY_LABEL when city is empty
  return COUNTRY_LABEL[country]?.replace(/^[^\s]+\s*/, "") ?? country;
}

export function ProfileView() {
  const [profile] = useProfile();
  const monogram = initials(profile.name, 3);

  // First name (without "さん") for visual flair in the heading
  const cleanName = profile.name.replace(/(さん|くん|さま|様)\s*$/, "");

  return (
    <>
      <AppHeader
        backHref="/search"
        title="プロフィール"
        subtitle="CAREER JOURNEY"
        trailing={
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-ink/15 bg-cream flex items-center justify-center text-ink"
            aria-label="メニュー"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        }
      />

      <main className="container-app py-5 relative z-10 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* IDENTITY */}
          <section className="pt-5 rise">
            <div className="bg-paper border border-ink/10 rounded-3xl p-5 shadow-pop relative overflow-hidden">
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-blue text-cream font-bold flex items-center justify-center text-2xl border border-ink/15 shadow-pop-sm display">
                      {monogram}
                    </div>
                    {profile.ccAvailable && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-jade border border-ink/20 flex items-center justify-center">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#0A1F3D"
                          strokeWidth="3"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="display font-bold text-[22px] text-ink leading-tight">
                      {profile.name}
                    </h1>
                    <p className="text-[12px] text-ink-soft mt-1 font-semibold">
                      {profile.age}歳 ·{" "}
                      在 {profile.city || profile.country} {profile.tenure}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {profile.ccAvailable && (
                        <span className="text-[10px] uppercase tracking-wider bg-jade/20 text-jade-deep px-2 py-0.5 rounded-full border border-jade/40 font-bold">
                          ⚡ 相談可
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-ink-faint font-bold">
                        ⭐ 4.9 · 23件
                      </span>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <p className="serif-it text-[15px] text-ink leading-relaxed whitespace-pre-line">
                    &quot;{profile.bio}&quot;
                  </p>
                )}

                {/* Current position chips */}
                <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                  <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                    💼 現在のポジション
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.industry && (
                      <Chip>
                        {INDUSTRY_LABEL[profile.industry] ?? profile.industry}
                      </Chip>
                    )}
                    {profile.role && (
                      <Chip>{ROLE_LABEL[profile.role] ?? profile.role}</Chip>
                    )}
                    {profile.visa && <Chip>🛂 {profile.visa}</Chip>}
                  </div>
                </div>

                {/* Goals — 志望中 */}
                <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                  <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                    🎯 次に目指す
                  </p>
                  {profile.goalCountry ||
                  profile.goalIndustry ||
                  profile.goalRole ||
                  profile.goalSalary ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.goalCountry && (
                        <Chip>{countryLabel(profile.goalCountry)}</Chip>
                      )}
                      {profile.goalIndustry && (
                        <Chip>
                          {INDUSTRY_LABEL[profile.goalIndustry] ??
                            profile.goalIndustry}
                        </Chip>
                      )}
                      {profile.goalRole && (
                        <Chip>
                          {ROLE_LABEL[profile.goalRole] ?? profile.goalRole}
                        </Chip>
                      )}
                      {profile.goalSalary && (
                        <Chip>
                          💴 {SALARY_LABEL[profile.goalSalary] ?? "—"}
                        </Chip>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-faint">未設定</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CAREER RIVER (driven by profile.career) */}
          <section className="mt-8 rise" style={{ animationDelay: "0.08s" }}>
            <h2 className="display font-bold text-[22px] leading-tight text-ink mb-4">
              歩んできた軌跡
            </h2>
            <div className="space-y-5">
              {profile.career.length === 0 ? (
                <p className="text-[12px] text-ink-faint">
                  まだステップが登録されていません。
                </p>
              ) : (
                profile.career.map((step) => (
                  <RiverStep key={step.id} step={step} />
                ))
              )}

              {/* 志望中 — future career step driven by goals */}
              {(profile.goalCountry ||
                profile.goalIndustry ||
                profile.goalRole) && (
                <div className="river-step">
                  <div className="river-dot future" />
                  <div className="bg-cream border border-dashed border-ink/30 rounded-3xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="display font-bold text-[16px] text-ink-faint">
                          ?
                        </span>
                        <span className="text-[11px] text-blue font-bold uppercase tracking-wider">
                          志望中
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-[14px] text-ink">
                      {[
                        countryLabel(profile.goalCountry).replace(/^\S+\s/, ""),
                        INDUSTRY_LABEL[profile.goalIndustry] ??
                          profile.goalIndustry,
                        ROLE_LABEL[profile.goalRole] ?? profile.goalRole,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {profile.goalSalary && (
                      <p className="text-[11px] text-ink-soft mt-1">
                        目標年収: {SALARY_LABEL[profile.goalSalary]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* TOPICS — 相談できる内容 (Coffee Chat) */}
          {profile.ccAvailable && profile.ccTopics && (
            <section className="mt-10 rise" style={{ animationDelay: "0.16s" }}>
              <h2 className="display font-bold text-[22px] leading-tight text-ink mb-3">
                ☕ 相談できる内容
              </h2>
              <div className="bg-paper border border-ink/10 rounded-3xl p-4 shadow-pop-sm">
                <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">
                  {profile.ccTopics}
                </p>
              </div>
            </section>
          )}

          {/* SKILLS */}
          {(profile.techSkills.length > 0 ||
            profile.businessSkills.length > 0) && (
            <section className="mt-10 rise" style={{ animationDelay: "0.2s" }}>
              <h2 className="display font-bold text-[22px] leading-tight text-ink mb-3">
                🧠 スキル
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {[...profile.techSkills, ...profile.businessSkills].map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 rounded-full border bg-cream text-ink-soft border-ink/15 font-bold"
                  >
                    #{s}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 mb-20 text-center">
            <div className="display text-[10px] uppercase tracking-[0.32em] text-ink-faint">
              X Border Hub
            </div>
            <div className="serif-it text-[14px] text-ink-soft mt-1">
              crossing borders, one career at a time.
            </div>
          </section>
        </div>
      </main>

      {profile.ccAvailable && (
        <ConsultApply name={cleanName} initialsText={monogram} />
      )}
      <BottomNavMobile />
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-2 py-0.5 bg-blue-soft border border-blue/30 rounded-full font-bold text-blue-deep">
      {children}
    </span>
  );
}

function RiverStep({ step }: { step: CareerStep }) {
  return (
    <div className="river-step">
      <div className={`river-dot ${step.current ? "major" : ""}`} />
      <div className="pass p-4 relative">
        {step.current && (
          <div className="absolute -top-2 -right-2 bg-blue text-cream text-[8px] font-bold px-2 py-1 rounded border border-ink/20 uppercase tracking-widest shadow-pop-sm">
            現在
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`display font-bold text-[16px] ${step.current ? "text-blue" : "text-ink"}`}
          >
            {COUNTRY_LABEL[step.country] ?? step.country ?? "—"}
          </span>
          <span className="text-[10px] text-ink-faint font-bold">
            {formatPeriod(step)}
          </span>
        </div>
        <p className="font-bold text-[14px] text-ink">{step.company || "—"}</p>
        <p className="text-[11px] text-ink-soft mt-0.5">
          {ROLE_LABEL[step.role] ?? step.role ?? "—"}
        </p>
        {step.achievements && (
          <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/15 pt-2 whitespace-pre-line">
            {step.achievements}
          </p>
        )}
      </div>
    </div>
  );
}
