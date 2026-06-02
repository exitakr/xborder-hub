"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { signOut } from "@/app/login/actions";
import type { VisibilitySettings } from "@/lib/anonymity/rules";
import { PrivacySettings } from "./PrivacySettings";

type EditType = "identity" | "career";
type CcTab = "sent" | "received";

const CAREER = [
  {
    place: "Tokyo",
    sub: "日本",
    years: "2014 - 2019",
    company: "Sony",
    role: "Product Manager · 5年",
    current: false,
  },
  {
    place: "Singapore",
    sub: "駐在",
    years: "2019 - 2022",
    company: "Sony Asia Pacific",
    role: "Regional PM · 3年",
    current: false,
  },
  {
    place: "Singapore",
    sub: "現地",
    years: "2022 - 現在",
    company: "Shopee",
    role: "Senior Product Manager · 2年",
    current: true,
  },
];

const EDIT_TITLES: Record<EditType, string> = {
  identity: "プロフィールを編集",
  career: "キャリアステップを追加",
};

// ───── Select options shared by the unified identity form ─────

const COUNTRY_OPTS = [
  { v: "", label: "—" },
  { v: "Japan", label: "🇯🇵 Japan" },
  { v: "Singapore", label: "🇸🇬 Singapore" },
  { v: "Hong Kong", label: "🇭🇰 Hong Kong" },
  { v: "Thailand", label: "🇹🇭 Thailand" },
  { v: "Vietnam", label: "🇻🇳 Vietnam" },
  { v: "Indonesia", label: "🇮🇩 Indonesia" },
  { v: "Malaysia", label: "🇲🇾 Malaysia" },
  { v: "United States", label: "🇺🇸 United States" },
  { v: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { v: "Germany", label: "🇩🇪 Germany" },
  { v: "Australia", label: "🇦🇺 Australia" },
];
const INDUSTRY_OPTS = [
  { v: "", label: "—" },
  { v: "Tech", label: "💻 Tech" },
  { v: "Finance", label: "🏦 Finance" },
  { v: "Startup", label: "🚀 Startup" },
  { v: "Consumer", label: "🛍 Consumer" },
  { v: "Manufacturing", label: "🏭 Manufacturing" },
  { v: "Healthcare", label: "🏥 Healthcare" },
  { v: "Education", label: "🎓 Education" },
  { v: "Consulting", label: "📊 Consulting" },
];
const ROLE_OPTS = [
  { v: "", label: "—" },
  { v: "Product Manager", label: "📐 Product Manager" },
  { v: "Engineer", label: "⚙️ Engineer" },
  { v: "BD / Sales", label: "💼 BD / Sales" },
  { v: "Marketing", label: "📣 Marketing" },
  { v: "Designer", label: "🎨 Designer" },
  { v: "Finance / Accounting", label: "📊 Finance / Accounting" },
  { v: "HR / People", label: "👥 HR / People" },
  { v: "Executive (VP+)", label: "🏛 Executive (VP+)" },
  { v: "Founder / Entrepreneur", label: "🚀 Founder / Entrepreneur" },
];
const VISA_OPTS = [
  { v: "", label: "—" },
  { v: "EP_SG", label: "EP (Singapore)" },
  { v: "S_Pass_SG", label: "S Pass (Singapore)" },
  { v: "PR_SG", label: "PR (Singapore)" },
  { v: "H1B", label: "H-1B (US)" },
  { v: "O1", label: "O-1 (US)" },
  { v: "L1", label: "L-1 (US)" },
  { v: "Green_Card", label: "Green Card (US)" },
  { v: "Tier2_UK", label: "Skilled Worker (UK)" },
  { v: "WP", label: "就労ビザ (その他)" },
  { v: "PR", label: "永住権 (その他)" },
  { v: "Citizen", label: "市民権" },
  { v: "none", label: "無し / 検討中" },
];
const JPY_SALARY_OPTS = [
  { v: "", label: "—" },
  { v: "lt_400", label: "〜400万円" },
  { v: "400_600", label: "400〜600万円" },
  { v: "600_800", label: "600〜800万円" },
  { v: "800_1000", label: "800〜1,000万円" },
  { v: "1000_1300", label: "1,000〜1,300万円" },
  { v: "1300_1600", label: "1,300〜1,600万円" },
  { v: "1600_2000", label: "1,600〜2,000万円" },
  { v: "gte_2000", label: "2,000万円以上" },
];
const TECH_SKILLS = [
  "SQL",
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "Go",
  "Tableau",
  "Power BI",
  "Gen AI",
  "Prompt Engineering",
  "Data Analytics",
  "ML / DL",
  "AWS",
  "GCP",
];
const BUSINESS_SKILLS = [
  "P&L Management",
  "Regional Management",
  "Team Management",
  "Product Management",
  "Brand Management",
  "Consulting",
  "Negotiation",
  "Multicultural Team",
  "Overseas Assignment",
];

type Identity = {
  name: string;
  age: string;
  country: string; // current country (select)
  city: string;
  tenure: string;
  bio: string;
  industry: string;
  role: string;
  visa: string;
  salary: string; // current JPY range
  techSkills: string[];
  businessSkills: string[];
  goalCountry: string;
  goalIndustry: string;
  goalRole: string;
  goalSalary: string;
};

const INITIAL_IDENTITY: Identity = {
  name: "YT さん",
  age: "34",
  country: "Singapore",
  city: "Singapore",
  tenure: "3年目",
  bio: "日系大手から東南アジアのTech企業へ。言葉と文化の壁を、3年で乗り越えた話なら、いつでもどうぞ。",
  industry: "Tech",
  role: "Product Manager",
  visa: "EP_SG",
  salary: "1300_1600",
  techSkills: ["SQL", "Gen AI", "Data Analytics"],
  businessSkills: ["Product Management", "Multicultural Team"],
  goalCountry: "United States",
  goalIndustry: "Startup",
  goalRole: "Executive (VP+)",
  goalSalary: "gte_2000",
};

function labelOf(opts: { v: string; label: string }[], v: string) {
  return opts.find((o) => o.v === v)?.label ?? "";
}

function initials(name: string): string {
  const cleaned = name.replace(/(さん|くん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    return (words[0]![0]! + (words[1]![0] ?? "")).toUpperCase();
  }
  if (/^[A-Za-z]+$/.test(cleaned)) {
    return cleaned.substring(0, 2).toUpperCase();
  }
  // Japanese / mixed — take first 2 chars
  return Array.from(cleaned).slice(0, 2).join("");
}

type CareerStep = (typeof CAREER)[number];
type CareerForm = {
  place: string;
  sub: string;
  years: string;
  company: string;
  role: string;
};

const BLANK_CAREER_FORM: CareerForm = {
  place: "",
  sub: "",
  years: "",
  company: "",
  role: "",
};

export function MyPageClient({
  visibilitySettings,
}: { visibilitySettings?: VisibilitySettings } = {}) {
  const [ccTab, setCcTab] = useState<CcTab>("sent");
  const [editType, setEditType] = useState<EditType | null>(null);
  const [premium, setPremium] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  // Profile state — single source of truth for what the cards display.
  // Edit modals commit into here on save so the page actually reflects
  // what was entered. Will be wired to Supabase profiles in a follow-up.
  const [identity, setIdentity] = useState<Identity>(INITIAL_IDENTITY);
  const [career, setCareer] = useState<CareerStep[]>(CAREER);

  // Per-edit form state, reset to the latest committed value whenever the
  // matching modal is opened.
  const [identityForm, setIdentityForm] = useState<Identity>(identity);
  const [careerForm, setCareerForm] = useState<CareerForm>(BLANK_CAREER_FORM);

  function openEdit(type: EditType) {
    if (type === "identity") setIdentityForm(identity);
    if (type === "career") setCareerForm(BLANK_CAREER_FORM);
    setEditType(type);
  }

  function toggleSkill(group: "techSkills" | "businessSkills", skill: string) {
    setIdentityForm((f) => {
      const current = f[group];
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return { ...f, [group]: next };
    });
  }

  function saveEdit() {
    if (editType === "identity") {
      setIdentity(identityForm);
    } else if (editType === "career") {
      const { place, sub, years, company, role: r } = careerForm;
      if (place.trim() && company.trim()) {
        // Demote any "current" flag from existing steps so only the new
        // one is highlighted.
        setCareer((prev) => [
          ...prev.map((step) => ({ ...step, current: false })),
          {
            place: place.trim() || "—",
            sub: sub.trim() || "—",
            years: years.trim() || "—",
            company: company.trim(),
            role: r.trim() || "—",
            current: true,
          },
        ]);
      }
    }
    setEditType(null);
  }

  useEffect(() => {
    setPremium(window.localStorage.getItem("xbh_premium") === "1");
  }, []);

  function logout() {
    window.localStorage.removeItem("xbh_premium");
    startSignOut(() => signOut());
  }

  const editOpen = editType !== null;

  return (
    <>
      <AppTopBar />

      <main className="container-app py-5 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          {/* MAIN */}
          <div className="app-grid-main space-y-8">
            {/* IDENTITY */}
            <section className="rise">
              <div className="bg-paper border border-ink/10 rounded-3xl p-5 lg:p-7 shadow-pop relative overflow-hidden">
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-blue text-cream font-bold flex items-center justify-center text-2xl lg:text-3xl border border-ink/15 shadow-pop-sm display">
                        {initials(identity.name)}
                      </div>
                      <div>
                        <h1 className="display font-bold text-[22px] lg:text-[28px] text-ink leading-tight">
                          {identity.name}
                        </h1>
                        <p className="text-[12px] lg:text-[14px] text-ink-soft mt-1 font-semibold">
                          {identity.age}歳 · 在 {identity.city || identity.country}{" "}
                          {identity.tenure}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider bg-jade/20 text-jade-deep px-2 py-0.5 rounded-full border border-jade/40 font-bold">
                            ⚡ 相談可
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-ink-faint font-bold">
                            ⭐ 4.9 · 23件
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit("identity")}
                      className="text-[11px] font-bold text-blue underline-offset-2 underline whitespace-nowrap"
                    >
                      編集
                    </button>
                  </div>

                  <p className="serif-it text-[14px] lg:text-[16px] text-ink leading-relaxed mt-4 whitespace-pre-line">
                    &quot;{identity.bio}&quot;
                  </p>

                  {/* Current professional snapshot */}
                  <div className="mt-5 pt-4 border-t border-dashed border-ink/15">
                    <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                      💼 現在のポジション
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {identity.industry && (
                        <Chip>{labelOf(INDUSTRY_OPTS, identity.industry)}</Chip>
                      )}
                      {identity.role && (
                        <Chip>{labelOf(ROLE_OPTS, identity.role)}</Chip>
                      )}
                      {identity.visa && (
                        <Chip>🛂 {labelOf(VISA_OPTS, identity.visa)}</Chip>
                      )}
                      {identity.salary && (
                        <Chip>💴 {labelOf(JPY_SALARY_OPTS, identity.salary)}</Chip>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {(identity.techSkills.length > 0 ||
                    identity.businessSkills.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                      <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                        🧠 スキル
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...identity.techSkills, ...identity.businessSkills].map(
                          (s) => (
                            <Chip key={s} muted>
                              #{s}
                            </Chip>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Goals (next career step) */}
                  <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                    <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                      🎯 次に目指す
                    </p>
                    {identity.goalCountry ||
                    identity.goalIndustry ||
                    identity.goalRole ||
                    identity.goalSalary ? (
                      <div className="flex flex-wrap gap-1.5">
                        {identity.goalCountry && (
                          <Chip>
                            {labelOf(COUNTRY_OPTS, identity.goalCountry)}
                          </Chip>
                        )}
                        {identity.goalIndustry && (
                          <Chip>
                            {labelOf(INDUSTRY_OPTS, identity.goalIndustry)}
                          </Chip>
                        )}
                        {identity.goalRole && (
                          <Chip>{labelOf(ROLE_OPTS, identity.goalRole)}</Chip>
                        )}
                        {identity.goalSalary && (
                          <Chip>
                            💴 {labelOf(JPY_SALARY_OPTS, identity.goalSalary)}
                          </Chip>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-faint">
                        まだ未設定 — 「編集」から追加できます
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* COFFEE CHAT */}
            <section className="rise" style={{ animationDelay: "0.08s" }}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">☕</span>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                      Coffee Chat 履歴
                    </p>
                  </div>
                  <h2 className="display font-bold text-[22px] lg:text-[24px] mt-1 leading-tight text-ink">
                    予約・申請
                  </h2>
                </div>
              </div>

              <div className="inline-flex gap-1 p-1 bg-paper border-[1.5px] border-ink rounded-xl mb-4 shadow-pop-sm flex-wrap">
                {(
                  [
                    { id: "sent", label: "📤 申請した" },
                    { id: "received", label: "📥 受けた" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCcTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      ccTab === tab.id
                        ? "bg-ink text-cream"
                        : "text-ink-soft"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {ccTab === "sent" && (
                <div className="space-y-3">
                  {/* 申請中 */}
                  <div className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue text-cream font-bold flex items-center justify-center text-xs border-[1.5px] border-ink flex-shrink-0">
                          RN
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-ink truncate">
                            RN さん
                          </p>
                          <p className="text-[10px] text-ink-soft">
                            TYO(DeNA) → SIN(Grab)
                          </p>
                        </div>
                      </div>
                      <span className="status-badge status-pending">申請中</span>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                      <span className="font-bold text-ink">相談内容:</span>{" "}
                      SG現地Tech企業への転職活動の進め方について、面接対策と給与交渉のコツを伺いたいです。
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-ink/20">
                      <p className="text-[10px] text-ink-faint">
                        申請日: 2026/05/12 · 無料
                      </p>
                      <button
                        type="button"
                        className="text-[11px] text-ink-soft font-bold"
                      >
                        取消
                      </button>
                    </div>
                  </div>

                  {/* 承認済 */}
                  <div className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-xs border-[1.5px] border-ink flex-shrink-0">
                          HK
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-ink truncate">
                            HK さん
                          </p>
                          <p className="text-[10px] text-ink-soft">
                            TYO(商社)→SIN→SGN
                          </p>
                        </div>
                      </div>
                      <span className="status-badge status-approved">✓ 承認</span>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                      <span className="font-bold text-ink">相談内容:</span>{" "}
                      商社からVN起業までの道のりと、家族同行の現実を聞きたい。
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-ink/20">
                      <p className="text-[10px] text-ink-faint">
                        日程: 2026/05/18 14:00 · SGD 80
                      </p>
                      <Link
                        href="/chat?with=HK"
                        className="px-3 py-1.5 bg-ink text-cream rounded-full font-bold text-[10px]"
                      >
                        💬 トークルーム
                      </Link>
                    </div>
                  </div>

                  {/* 完了 */}
                  <div className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm opacity-90">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-mustard text-ink font-bold flex items-center justify-center text-xs border-[1.5px] border-ink flex-shrink-0">
                          SK
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-ink truncate">
                            SK さん
                          </p>
                          <p className="text-[10px] text-ink-soft">
                            OSA(P&amp;G) → SIN(P&amp;G APAC)
                          </p>
                        </div>
                      </div>
                      <span className="status-badge status-completed">
                        ✓ 完了
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-ink/20">
                      <p className="text-[10px] text-ink-faint">
                        2026/04/22 実施 · SGD 50
                      </p>
                      <button
                        type="button"
                        className="text-[11px] text-blue font-bold"
                      >
                        レビューする
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ccTab === "received" && (
                <div className="space-y-3">
                  <div className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-plum text-cream font-bold flex items-center justify-center text-xs border-[1.5px] border-ink flex-shrink-0">
                          TM
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-ink truncate">
                            TM さん
                          </p>
                          <p className="text-[10px] text-ink-soft">
                            TYO → 検討中
                          </p>
                        </div>
                      </div>
                      <span className="status-badge status-pending">未対応</span>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                      <span className="font-bold text-ink">相談内容:</span>{" "}
                      SGに行く前に、PMとして英語環境でやっていけるか不安です。準備しておくべきことを教えてください。
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-cream border-[1.5px] border-ink text-ink rounded-full font-bold text-[10px]"
                      >
                        却下
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-jade-deep text-cream rounded-full font-bold text-[10px]"
                      >
                        ✓ 承認
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* CAREER */}
            <section className="rise" style={{ animationDelay: "0.16s" }}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌊</span>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                      キャリアの川
                    </p>
                  </div>
                  <h2 className="display font-bold text-[22px] lg:text-[24px] mt-1 leading-tight text-ink">
                    歩んできた軌跡
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit("career")}
                  className="text-[11px] font-bold text-blue"
                >
                  + ステップ追加
                </button>
              </div>

              <div className="space-y-3">
                {career.map((step, i) => (
                  <div key={i} className="pass p-4 relative">
                    {step.current && (
                      <div className="absolute -top-2 -right-2 bg-blue text-cream text-[8px] font-bold px-2 py-1 rounded border-[1.5px] border-ink uppercase tracking-widest shadow-pop-sm">
                        現在
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`display font-bold text-[16px] ${step.current ? "text-blue" : "text-ink"}`}
                        >
                          {step.place}
                        </span>
                        <span className="text-[11px] text-ink-soft font-bold">
                          {step.sub}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-faint font-bold">
                        {step.years}
                      </span>
                    </div>
                    <p className="font-bold text-[14px] text-ink">
                      {step.company}
                    </p>
                    <p className="text-[11px] text-ink-soft mt-0.5">
                      {step.role}
                    </p>
                    <button
                      type="button"
                      className="text-[10px] text-blue font-bold mt-2"
                    >
                      編集
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <PrivacySettings initial={visibilitySettings} />

            {/* SETTINGS */}
            <section className="rise" style={{ animationDelay: "0.24s" }}>
              <h2 className="display font-bold text-[20px] lg:text-[22px] mt-1 leading-tight text-ink mb-4">
                ⚙️ 設定
              </h2>
              <div className="space-y-2">
                <Link
                  href="/premium"
                  className="w-full flex items-center justify-between bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✦</span>
                    <div className="text-left">
                      <p className="font-bold text-[13px] text-ink">
                        プレミアム会員
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {premium ? "✦ 加入中" : "未加入"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-blue font-bold">登録 →</span>
                </Link>
                <button
                  type="button"
                  className="w-full flex items-center justify-between bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    <div className="text-left">
                      <p className="font-bold text-[13px] text-ink">通知設定</p>
                      <p className="text-[11px] text-ink-soft">
                        メール・プッシュ通知
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-soft">›</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-between bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <div className="text-left">
                      <p className="font-bold text-[13px] text-ink">
                        プライバシー
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        公開範囲・匿名設定
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-soft">›</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  disabled={signingOut}
                  className="w-full flex items-center justify-between bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚪</span>
                    <div className="text-left">
                      <p className="font-bold text-[13px] text-ink">
                        {signingOut ? "ログアウト中…" : "ログアウト"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-soft">›</span>
                </button>
              </div>
            </section>
          </div>

          {/* SIDE */}
          <aside className="app-grid-side hidden lg:block">
            <div
              className="side-nav-card bg-ink text-cream"
              style={{ background: "#0A1F3D" }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-mustard font-bold mb-2">
                ✦ Premium
              </p>
              <p className="display font-bold text-[15px] leading-tight text-cream">
                給与データをすべて見る
              </p>
              <Link
                href="/premium"
                className="mt-3 block text-center py-2 bg-mustard text-ink rounded-full font-bold text-[11px]"
              >
                無料トライアル →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* EDIT MODAL */}
      <div
        className={`modal-overlay ${editOpen ? "open" : ""}`}
        onClick={() => setEditType(null)}
      />
      <div className={`modal-sheet ${editOpen ? "open" : ""}`}>
        <div className="px-5 pt-2">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="display font-bold text-[20px] text-ink">
              {editType ? EDIT_TITLES[editType] : ""}
            </h3>
            <button
              type="button"
              onClick={() => setEditType(null)}
              className="w-8 h-8 rounded-full bg-paper border-[1.5px] border-ink flex items-center justify-center text-ink"
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

          <div className="pb-6 space-y-5">
            {editType === "identity" && (
              <>
                {/* Section: 基本情報 */}
                <FormSection title="基本情報">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="表示名">
                      <input
                        type="text"
                        className="field"
                        value={identityForm.name}
                        onChange={(e) =>
                          setIdentityForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="年齢">
                      <input
                        type="number"
                        className="field"
                        value={identityForm.age}
                        onChange={(e) =>
                          setIdentityForm((f) => ({ ...f, age: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="現在の国">
                      <Select
                        value={identityForm.country}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, country: v }))
                        }
                        options={COUNTRY_OPTS}
                      />
                    </Field>
                    <Field label="現在の都市">
                      <input
                        type="text"
                        className="field"
                        placeholder="例: Singapore"
                        value={identityForm.city}
                        onChange={(e) =>
                          setIdentityForm((f) => ({ ...f, city: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="滞在年数">
                      <input
                        type="text"
                        className="field"
                        placeholder="例: 3年目"
                        value={identityForm.tenure}
                        onChange={(e) =>
                          setIdentityForm((f) => ({
                            ...f,
                            tenure: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="自己紹介">
                    <textarea
                      className="field"
                      rows={4}
                      value={identityForm.bio}
                      onChange={(e) =>
                        setIdentityForm((f) => ({ ...f, bio: e.target.value }))
                      }
                    />
                  </Field>
                </FormSection>

                {/* Section: 現在のポジション */}
                <FormSection title="現在のポジション">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="業界">
                      <Select
                        value={identityForm.industry}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, industry: v }))
                        }
                        options={INDUSTRY_OPTS}
                      />
                    </Field>
                    <Field label="職種">
                      <Select
                        value={identityForm.role}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, role: v }))
                        }
                        options={ROLE_OPTS}
                      />
                    </Field>
                    <Field label="VISA">
                      <Select
                        value={identityForm.visa}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, visa: v }))
                        }
                        options={VISA_OPTS}
                      />
                    </Field>
                    <Field label="現在の年収レンジ">
                      <Select
                        value={identityForm.salary}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, salary: v }))
                        }
                        options={JPY_SALARY_OPTS}
                      />
                    </Field>
                  </div>
                </FormSection>

                {/* Section: スキル */}
                <FormSection title="スキル">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mb-1.5">
                    Tech / Data
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_SKILLS.map((s) => {
                      const active = identityForm.techSkills.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSkill("techSkills", s)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            active
                              ? "bg-ink text-cream border-ink"
                              : "bg-cream text-ink border-ink/15 hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mt-3 mb-1.5">
                    Business / 海外
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BUSINESS_SKILLS.map((s) => {
                      const active = identityForm.businessSkills.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSkill("businessSkills", s)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            active
                              ? "bg-ink text-cream border-ink"
                              : "bg-cream text-ink border-ink/15 hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </FormSection>

                {/* Section: 次に目指す (merged with identity) */}
                <FormSection title="🎯 次に目指す">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="目指す国">
                      <Select
                        value={identityForm.goalCountry}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, goalCountry: v }))
                        }
                        options={COUNTRY_OPTS}
                      />
                    </Field>
                    <Field label="目指す業界">
                      <Select
                        value={identityForm.goalIndustry}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, goalIndustry: v }))
                        }
                        options={INDUSTRY_OPTS}
                      />
                    </Field>
                    <Field label="目指す職種">
                      <Select
                        value={identityForm.goalRole}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, goalRole: v }))
                        }
                        options={ROLE_OPTS}
                      />
                    </Field>
                    <Field label="目指す年収レンジ">
                      <Select
                        value={identityForm.goalSalary}
                        onChange={(v) =>
                          setIdentityForm((f) => ({ ...f, goalSalary: v }))
                        }
                        options={JPY_SALARY_OPTS}
                      />
                    </Field>
                  </div>
                </FormSection>
              </>
            )}

            {editType === "career" && (
              <>
                <div>
                  <label className="label">国・都市</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Singapore"
                    value={careerForm.place}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, place: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">区分(駐在 / 現地 など、任意)</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: 現地採用"
                    value={careerForm.sub}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, sub: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">会社</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Shopee"
                    value={careerForm.company}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, company: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">役職</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Senior Product Manager · 2年"
                    value={careerForm.role}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, role: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">期間</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: 2022 - 現在"
                    value={careerForm.years}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, years: e.target.value }))
                    }
                  />
                </div>
                <p className="text-[11px] text-ink-soft">
                  追加されたステップは自動的に「現在」フラグが立ちます。
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={saveEdit}
            className="btn-primary w-full mb-4"
          >
            保存する
          </button>
        </div>
      </div>

      <BottomNavMobile />
    </>
  );
}

// ───── Small presentational helpers used only by the identity card ─────

function Chip({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${
        muted
          ? "bg-cream text-ink-soft border-ink/15"
          : "bg-blue-soft text-blue-deep border-blue/30"
      }`}
    >
      {children}
    </span>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint font-bold">
        {title}
      </p>
      {children}
    </div>
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

function Select({
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
