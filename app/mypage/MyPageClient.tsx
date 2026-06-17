"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { AppFooter } from "@/components/site/AppFooter";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { signOut } from "@/app/login/actions";
import { syncProfileBasics } from "./actions";
import type { VisibilitySettings } from "@/lib/anonymity/rules";
import { useNotifications } from "@/lib/notifications/store";
import {
  approveCoffeeChatRequest,
  cancelCoffeeChatRequest,
  rejectCoffeeChatRequest,
} from "@/lib/coffee-chat/actions";
import type { DisplayCcRequest } from "@/lib/coffee-chat/queries";
import type { CompensationData } from "@/lib/supabase/database.types";
import { SHOW_DEMO_CONTENT } from "@/lib/demo/flags";
import {
  COUNTRY_OPTS,
  ENGLISH_USAGE_OPTS,
  INDUSTRY_OPTS,
  JPY_SALARY_OPTS,
  RENT_OPTS,
  ROLE_OPTS,
  SAVINGS_RATE_OPTS,
  VISA_OPTS,
} from "@/lib/profile/options";
import {
  formatPeriod,
  initials,
  useProfile,
  type CareerStep,
  type Profile,
} from "@/lib/profile/store";
import {
  CareerEditorRow,
  Field,
  Select,
  freshStep,
} from "@/components/profile/CareerEditor";

type CcTab = "sent" | "received";

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

function labelOf(opts: { v: string; label: string }[], v: string) {
  return opts.find((o) => o.v === v)?.label ?? "";
}

type CcReceivedStatus = "pending" | "approved" | "rejected";
type CcReceivedItem = {
  id: string;
  initials: string;
  bg: string;
  text: string;
  name: string;
  path: string;
  topic: string;
  status: CcReceivedStatus;
};

const INITIAL_CC_RECEIVED: CcReceivedItem[] = [
  {
    id: "rcv-1",
    initials: "TM",
    bg: "bg-plum",
    text: "text-cream",
    name: "TM さん",
    path: "TYO → 検討中",
    topic:
      "SGに行く前に、PMとして英語環境でやっていけるか不安です。準備しておくべきことを教えてください。",
    status: "pending",
  },
];

/* ─────────── Career grouping (LinkedIn-style) ─────────── */

type CareerGroup = {
  company: string;
  steps: CareerStep[];
  /** Sort key: latest start date in this group (YYYYMM, current → 999999) */
  sortKey: number;
  /** "5 yrs 3 mos" style summary across all roles in this company */
  totalSpanLabel: string;
};

function ym(step: CareerStep): { start: number; end: number } {
  const s =
    Number(step.startYear || 0) * 100 + Number(step.startMonth || 1);
  const e = step.current
    ? 999912
    : Number(step.endYear || 0) * 100 + Number(step.endMonth || 12);
  return { start: s, end: e };
}

function totalMonthsFor(step: CareerStep): number {
  const { start, end } = ym(step);
  if (!step.startYear) return 0;
  const sy = Math.floor(start / 100);
  const sm = start % 100;
  const isCurrent = step.current || end === 999912;
  const now = new Date();
  const ey = isCurrent ? now.getFullYear() : Math.floor(end / 100);
  const em = isCurrent ? now.getMonth() + 1 : end % 100;
  return Math.max(0, (ey - sy) * 12 + (em - sm) + 1);
}

function humanizeMonths(total: number): string {
  if (total <= 0) return "";
  const y = Math.floor(total / 12);
  const m = total % 12;
  if (y === 0) return `${m} ヶ月`;
  if (m === 0) return `${y} 年`;
  return `${y} 年 ${m} ヶ月`;
}

function groupCareer(steps: CareerStep[]): CareerGroup[] {
  if (steps.length === 0) return [];
  // Sort newest first.
  const sorted = [...steps].sort((a, b) => {
    const aa = ym(a);
    const bb = ym(b);
    return bb.start - aa.start;
  });
  // Group consecutive same-company steps so a single company that contains
  // multiple roles renders like the LinkedIn "company with sub-positions"
  // card. Non-consecutive repeats (rejoined later) become separate groups.
  const groups: CareerGroup[] = [];
  for (const step of sorted) {
    const key = step.company.trim() || "—";
    const last = groups[groups.length - 1];
    if (last && last.company === key) {
      last.steps.push(step);
    } else {
      groups.push({ company: key, steps: [step], sortKey: ym(step).start, totalSpanLabel: "" });
    }
  }
  for (const g of groups) {
    const total = g.steps.reduce((acc, s) => acc + totalMonthsFor(s), 0);
    g.totalSpanLabel = humanizeMonths(total);
  }
  return groups;
}

/* ─────────── Component ─────────── */

export function MyPageClient({
  visibilitySettings,
  dbCcSent = [],
  dbCcReceived = [],
  ownComp = null,
}: {
  visibilitySettings?: VisibilitySettings;
  dbCcSent?: DisplayCcRequest[];
  dbCcReceived?: DisplayCcRequest[];
  ownComp?: CompensationData | null;
} = {}) {
  void visibilitySettings; // privacy section removed; prop kept for API compat

  const router = useRouter();
  const { addNotification } = useNotifications();
  const [ccTab, setCcTab] = useState<CcTab>("sent");
  const [ccReceived, setCcReceived] = useState<CcReceivedItem[]>(
    SHOW_DEMO_CONTENT ? INITIAL_CC_RECEIVED : [],
  );
  const [ccBusy, setCcBusy] = useState<string | null>(null);
  const [ccError, setCcError] = useState<string | null>(null);

  async function callCcAction(
    id: string,
    label: string,
    fn: (
      id: string,
    ) => Promise<{ ok: boolean; error?: string; chatRoomId?: string | null }>,
  ): Promise<{ ok: boolean; chatRoomId?: string | null }> {
    setCcBusy(id);
    setCcError(null);
    const res = await fn(id);
    setCcBusy(null);
    if (!("ok" in res) || !res.ok) {
      setCcError(("error" in res && res.error) || `${label}に失敗しました`);
      return { ok: false };
    }
    router.refresh();
    return { ok: true, chatRoomId: res.chatRoomId ?? null };
  }

  const [editOpen, setEditOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  // Single source of truth — persisted to localStorage and shared across
  // AppTopBar, /profile, and /search.
  const [profile, setProfile] = useProfile();
  const { career } = profile;

  // Unified edit-form state. Reset to current profile every time the
  // modal is opened so "キャンセル" cleanly discards.
  const [form, setForm] = useState<Profile>(profile);

  function openEdit() {
    setForm({ ...profile, career: profile.career.map((s) => ({ ...s })) });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  function toggleSkill(group: "techSkills" | "businessSkills", skill: string) {
    setForm((f) => {
      const current = f[group];
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return { ...f, [group]: next };
    });
  }

  function setStep(id: string, patch: Partial<CareerStep>) {
    setForm((f) => ({
      ...f,
      career: f.career.map((s) => {
        if (s.id !== id) return patch.current ? { ...s, current: false } : s;
        const merged = { ...s, ...patch };
        // When "current" is on, end-date fields are cleared.
        if (merged.current) {
          merged.endYear = "";
          merged.endMonth = "";
        }
        return merged;
      }),
    }));
  }

  function addBlankStep() {
    setForm((f) => ({ ...f, career: [...f.career, freshStep()] }));
  }

  function removeStep(id: string) {
    setForm((f) => ({ ...f, career: f.career.filter((s) => s.id !== id) }));
  }

  function saveAll() {
    // Persist all sections in one go — localStorage for instant UI, then
    // the full profile to Supabase so it reaches every page / user / device.
    const cleaned = {
      ...form,
      career: form.career.filter((s) => s.company.trim() || s.role || s.country),
    };
    setProfile(cleaned);
    void syncProfileBasics(cleaned);
    setEditOpen(false);
  }

  function logout() {
    // Clear any legacy premium-tier flag from earlier builds.
    window.localStorage.removeItem("xbh_premium");
    startSignOut(() => signOut());
  }

  function approveCcRequest(id: string) {
    const item = ccReceived.find((r) => r.id === id);
    if (!item) return;
    setCcReceived((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    addNotification({
      kind: "chat_approved",
      group: "Coffee Chat",
      title: `${item.name} の申請を承認しました`,
      body: `トークルームが開きました — ${item.topic.slice(0, 40)}…`,
      href: `/chat?with=${encodeURIComponent(item.initials)}`,
    });
    router.push(`/chat?with=${encodeURIComponent(item.initials)}`);
  }

  function rejectCcRequest(id: string) {
    setCcReceived((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
    );
  }

  const careerGroups = useMemo(() => groupCareer(career), [career]);

  return (
    <>
      <AppTopBar />

      <main className="container-app py-5 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          {/* MAIN */}
          <div className="app-grid-main space-y-8">
            {/* IDENTITY — single edit button at the top covers EVERYTHING */}
            <section className="rise">
              <div className="bg-paper border border-ink/10 rounded-3xl p-5 lg:p-7 shadow-pop relative overflow-hidden">
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-blue text-cream font-bold flex items-center justify-center text-2xl lg:text-3xl border border-ink/15 shadow-pop-sm display">
                        {initials(profile.name, 3)}
                      </div>
                      <div>
                        <h1 className="display font-bold text-[22px] lg:text-[28px] text-ink leading-tight">
                          {profile.name || "プロフィールを設定しましょう"}
                        </h1>
                        {profile.name ? (
                          <p className="text-[12px] lg:text-[14px] text-ink-soft mt-1 font-semibold">
                            {profile.age ? `${profile.age}歳 · ` : ""}
                            {(profile.city || profile.country) &&
                              `在 ${profile.city || profile.country} `}
                            {profile.tenure}
                          </p>
                        ) : (
                          <p className="text-[12px] text-ink-soft mt-1">
                            「編集」から名前・経歴・年収などをまとめて登録できます。
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {profile.ccAvailable && (
                            <span className="text-[10px] uppercase tracking-wider bg-jade/20 text-jade-deep px-2 py-0.5 rounded-full border border-jade/40 font-bold">
                              ⚡ 相談可
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openEdit}
                      className="text-[11px] font-bold text-cream bg-ink px-3 py-1.5 rounded-full whitespace-nowrap shadow-pop-sm"
                    >
                      ✎ 編集
                    </button>
                  </div>

                  {profile.bio && (
                    <p className="serif-it text-[14px] lg:text-[16px] text-ink leading-relaxed mt-4 whitespace-pre-line">
                      &quot;{profile.bio}&quot;
                    </p>
                  )}

                  {/* Current professional snapshot */}
                  <div className="mt-5 pt-4 border-t border-dashed border-ink/15">
                    <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                      💼 現在のポジション
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.industry && (
                        <Chip>{labelOf(INDUSTRY_OPTS, profile.industry)}</Chip>
                      )}
                      {profile.role && (
                        <Chip>{labelOf(ROLE_OPTS, profile.role)}</Chip>
                      )}
                      {profile.visa && (
                        <Chip>🛂 {labelOf(VISA_OPTS, profile.visa)}</Chip>
                      )}
                      {profile.salary && (
                        <Chip>💴 {labelOf(JPY_SALARY_OPTS, profile.salary)}</Chip>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {(profile.techSkills.length > 0 ||
                    profile.businessSkills.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                      <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                        🧠 スキル
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...profile.techSkills, ...profile.businessSkills].map(
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
                    {profile.goalCountry ||
                    profile.goalIndustry ||
                    profile.goalRole ||
                    profile.goalSalary ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.goalCountry && (
                          <Chip>{labelOf(COUNTRY_OPTS, profile.goalCountry)}</Chip>
                        )}
                        {profile.goalIndustry && (
                          <Chip>
                            {labelOf(INDUSTRY_OPTS, profile.goalIndustry)}
                          </Chip>
                        )}
                        {profile.goalRole && (
                          <Chip>{labelOf(ROLE_OPTS, profile.goalRole)}</Chip>
                        )}
                        {profile.goalSalary && (
                          <Chip>
                            💴 {labelOf(JPY_SALARY_OPTS, profile.goalSalary)}
                          </Chip>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-faint">
                        まだ未設定 — 「編集」から追加できます
                      </span>
                    )}
                  </div>

                  {/* Coffee Chat topic preview */}
                  <div className="mt-4 pt-4 border-t border-dashed border-ink/15">
                    <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                      ☕ Coffee Chat
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        profile.ccAvailable
                          ? "bg-jade/20 text-jade-deep border-jade/40"
                          : "bg-paper text-ink-soft border-ink/15"
                      }`}
                    >
                      {profile.ccAvailable ? "⚡ 相談受付中" : "🔒 現在は受付停止"}
                    </span>
                    {profile.ccAvailable && profile.ccTopics && (
                      <p className="text-[12px] text-ink mt-2 leading-relaxed whitespace-pre-line">
                        {profile.ccTopics}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SALARY DATA (mirrors what was submitted on /salaries) */}
            <section className="rise" style={{ animationDelay: "0.06s" }}>
              <div className="flex items-end justify-between mb-3">
                <h2 className="display font-bold text-[22px] lg:text-[24px] leading-tight text-ink">
                  💴 年収データ
                </h2>
                <Link
                  href="/salaries"
                  className="text-[11px] font-bold text-blue whitespace-nowrap"
                >
                  {ownComp ? "編集" : "投稿する"} →
                </Link>
              </div>
              {ownComp ? (
                <div className="bg-cream border border-ink rounded-3xl p-4 lg:p-5 shadow-pop-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[13px] text-ink truncate">
                        {labelOf(INDUSTRY_OPTS, ownComp.industry ?? "") ||
                          ownComp.industry ||
                          "—"}
                        {" · "}
                        {labelOf(ROLE_OPTS, ownComp.role ?? "") ||
                          ownComp.role ||
                          "—"}
                      </p>
                      <p className="text-[11px] text-ink-soft mt-0.5">
                        {[ownComp.country, ownComp.city]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="display font-bold text-[20px] text-ink leading-none">
                        {labelOf(JPY_SALARY_OPTS, ownComp.total_comp_range ?? "") ||
                          "—"}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-ink-faint font-bold mt-1">
                        年収(総額)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ownComp.base_salary_range && (
                      <Chip>
                        基本給 {labelOf(JPY_SALARY_OPTS, ownComp.base_salary_range)}
                      </Chip>
                    )}
                    {ownComp.monthly_rent_range && (
                      <Chip>
                        🏠 家賃 {labelOf(RENT_OPTS, ownComp.monthly_rent_range)}
                      </Chip>
                    )}
                    {ownComp.savings_rate_range && (
                      <Chip>
                        💰 貯蓄率{" "}
                        {labelOf(SAVINGS_RATE_OPTS, ownComp.savings_rate_range)}
                      </Chip>
                    )}
                    {ownComp.visa_type && (
                      <Chip>🛂 {labelOf(VISA_OPTS, ownComp.visa_type)}</Chip>
                    )}
                    {ownComp.english_usage_rate && (
                      <Chip>
                        🗣 英語{" "}
                        {labelOf(ENGLISH_USAGE_OPTS, ownComp.english_usage_rate)}
                      </Chip>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-faint mt-3 pt-2.5 border-t border-dashed border-ink/15">
                    一覧では匿名のレンジ値として公開されます(名前とは紐付きません)。
                  </p>
                </div>
              ) : (
                <Link
                  href="/salaries"
                  className="block bg-cream border border-dashed border-ink/30 rounded-3xl p-4 lg:p-5 text-center"
                >
                  <p className="text-[12px] text-ink-soft leading-relaxed">
                    まだ年収データを投稿していません。
                    <br />
                    匿名で投稿すると、ここと一覧に反映され、みんなの実数が見られます。
                  </p>
                  <span className="mt-2 inline-block text-[11px] font-bold text-blue">
                    年収データを投稿する →
                  </span>
                </Link>
              )}
            </section>

            {/* CAREER — LinkedIn-style grouped timeline */}
            <section className="rise" style={{ animationDelay: "0.12s" }}>
              <h2 className="display font-bold text-[22px] lg:text-[24px] leading-tight text-ink mb-4">
                歩んできた軌跡
              </h2>
              {careerGroups.length === 0 ? (
                <p className="text-[12px] text-ink-faint">
                  まだステップがありません。「✎ 編集」から登録してください。
                </p>
              ) : (
                <div className="space-y-4">
                  {careerGroups.map((g, idx) => (
                    <CompanyGroupCard key={`${g.company}-${idx}`} group={g} />
                  ))}
                </div>
              )}
            </section>

            {/* COFFEE CHAT (history only — toggle moved to unified edit modal) */}
            <section className="rise" style={{ animationDelay: "0.16s" }}>
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
                <Link
                  href="/chat"
                  className="text-[11px] font-bold text-blue whitespace-nowrap"
                >
                  トークルーム一覧 →
                </Link>
              </div>

              <div className="inline-flex gap-1 p-1 bg-paper border border-ink rounded-xl mb-4 shadow-pop-sm flex-wrap">
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

              {ccTab === "sent" && dbCcSent.length > 0 && (
                <div className="space-y-3">
                  {ccError && (
                    <p className="text-[11px] font-bold text-red-600">
                      {ccError}
                    </p>
                  )}
                  {dbCcSent.map((r) => (
                    <CcSentCard
                      key={r.id}
                      r={r}
                      busy={ccBusy === r.id}
                      onCancel={() =>
                        callCcAction(r.id, "取消", cancelCoffeeChatRequest)
                      }
                    />
                  ))}
                </div>
              )}

              {ccTab === "sent" && dbCcSent.length === 0 && (
                <p className="text-[12px] text-ink-faint">
                  まだ申請していません。気になる人を
                  <Link href="/search" className="text-blue font-bold underline">
                    キャリア検索
                  </Link>
                  で見つけて、Coffee Chat を申請してみましょう。
                </p>
              )}

              {ccTab === "received" && dbCcReceived.length > 0 && (
                <div className="space-y-3">
                  {ccError && (
                    <p className="text-[11px] font-bold text-red-600">
                      {ccError}
                    </p>
                  )}
                  {dbCcReceived.map((r) => (
                    <CcReceivedCard
                      key={r.id}
                      r={r}
                      busy={ccBusy === r.id}
                      onReject={() =>
                        callCcAction(r.id, "却下", rejectCoffeeChatRequest)
                      }
                      onApprove={async () => {
                        const res = await callCcAction(
                          r.id,
                          "承認",
                          approveCoffeeChatRequest,
                        );
                        if (res.ok) {
                          router.push(
                            res.chatRoomId
                              ? `/chat?room=${res.chatRoomId}`
                              : `/chat?with=${encodeURIComponent(r.otherInitials)}`,
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {ccTab === "received" && dbCcReceived.length === 0 && (
                <div className="space-y-3">
                  {ccReceived.length === 0 ? (
                    <p className="text-[12px] text-ink-faint">
                      まだ受信していません。
                    </p>
                  ) : (
                    ccReceived.map((r) => (
                      <DemoCcReceivedCard
                        key={r.id}
                        r={r}
                        onReject={() => rejectCcRequest(r.id)}
                        onApprove={() => approveCcRequest(r.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </section>

            {/* SETTINGS */}
            <section className="rise" style={{ animationDelay: "0.24s" }}>
              <h2 className="display font-bold text-[20px] lg:text-[22px] mt-1 leading-tight text-ink mb-4">
                ⚙️ 設定
              </h2>
              <div className="space-y-2">
                <Link
                  href="/notifications"
                  className="w-full flex items-center justify-between bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm hover:border-ink transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    <div className="text-left">
                      <p className="font-bold text-[13px] text-ink">通知設定</p>
                      <p className="text-[11px] text-ink-soft">
                        通知履歴・プッシュ通知の対象
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-soft">›</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  disabled={signingOut}
                  className="w-full flex items-center justify-between bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm disabled:opacity-60"
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
          <aside className="app-grid-side hidden lg:block space-y-3">
            <div
              className="side-nav-card bg-ink text-cream"
              style={{ background: "#0A1F3D" }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-mustard font-bold mb-2">
                ☕ Coffee Chat
              </p>
              <p className="display font-bold text-[15px] leading-tight text-cream">
                先に行った人に、話を聞こう
              </p>
              <Link
                href="/search"
                className="mt-3 block text-center py-2 bg-mustard text-ink rounded-full font-bold text-[11px]"
              >
                メンバーを探す →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* UNIFIED EDIT MODAL — all sections in one screen */}
      <div
        className={`modal-overlay ${editOpen ? "open" : ""}`}
        onClick={closeEdit}
      />
      <div className={`modal-sheet ${editOpen ? "open" : ""}`}>
        <div className="px-5 lg:px-7 pt-2">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4 lg:hidden" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="display font-bold text-[20px] lg:text-[24px] text-ink">
              プロフィール編集
            </h3>
            <button
              type="button"
              onClick={closeEdit}
              className="w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink"
              aria-label="閉じる"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-[11px] text-ink-soft mb-4 leading-relaxed">
            基本情報・現在のポジション・スキル・志望・経歴・Coffee Chat 受付設定を
            まとめて 1 画面で更新できます。最後に「保存する」を押してください。
          </p>

          <div className="pb-6 space-y-6">
            {/* Basic */}
            <FormSection title="基本情報">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="表示名">
                  <input
                    type="text"
                    className="field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="年齢">
                  <input
                    type="number"
                    className="field"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </Field>
                <Field label="出身国 (From)">
                  <Select
                    value={form.fromCountry}
                    onChange={(v) => setForm({ ...form, fromCountry: v })}
                    options={COUNTRY_OPTS}
                  />
                </Field>
                <Field label="出身都市 (From)">
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Tokyo"
                    value={form.fromCity}
                    onChange={(e) =>
                      setForm({ ...form, fromCity: e.target.value })
                    }
                  />
                </Field>
                <Field label="現在の国 (To)">
                  <Select
                    value={form.country}
                    onChange={(v) => setForm({ ...form, country: v })}
                    options={COUNTRY_OPTS}
                  />
                </Field>
                <Field label="現在の都市 (To)">
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Singapore"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
                <Field label="滞在年数">
                  <input
                    type="text"
                    className="field"
                    placeholder="例: 3年目"
                    value={form.tenure}
                    onChange={(e) => setForm({ ...form, tenure: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="自己紹介">
                <textarea
                  className="field"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </Field>
            </FormSection>

            {/* Current position */}
            <FormSection title="現在のポジション">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="業界">
                  <Select
                    value={form.industry}
                    onChange={(v) => setForm({ ...form, industry: v })}
                    options={INDUSTRY_OPTS}
                  />
                </Field>
                <Field label="職種">
                  <Select
                    value={form.role}
                    onChange={(v) => setForm({ ...form, role: v })}
                    options={ROLE_OPTS}
                  />
                </Field>
                <Field label="VISA">
                  <Select
                    value={form.visa}
                    onChange={(v) => setForm({ ...form, visa: v })}
                    options={VISA_OPTS}
                  />
                </Field>
                <Field label="現在の年収レンジ">
                  <Select
                    value={form.salary}
                    onChange={(v) => setForm({ ...form, salary: v })}
                    options={JPY_SALARY_OPTS}
                  />
                </Field>
              </div>
            </FormSection>

            {/* Skills */}
            <FormSection title="スキル">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint font-bold mb-1.5">
                Tech / Data
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TECH_SKILLS.map((s) => {
                  const active = form.techSkills.includes(s);
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
                  const active = form.businessSkills.includes(s);
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

            {/* Goals */}
            <FormSection title="🎯 次に目指す">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="目指す国">
                  <Select
                    value={form.goalCountry}
                    onChange={(v) => setForm({ ...form, goalCountry: v })}
                    options={COUNTRY_OPTS}
                  />
                </Field>
                <Field label="目指す業界">
                  <Select
                    value={form.goalIndustry}
                    onChange={(v) => setForm({ ...form, goalIndustry: v })}
                    options={INDUSTRY_OPTS}
                  />
                </Field>
                <Field label="目指す職種">
                  <Select
                    value={form.goalRole}
                    onChange={(v) => setForm({ ...form, goalRole: v })}
                    options={ROLE_OPTS}
                  />
                </Field>
                <Field label="目指す年収レンジ">
                  <Select
                    value={form.goalSalary}
                    onChange={(v) => setForm({ ...form, goalSalary: v })}
                    options={JPY_SALARY_OPTS}
                  />
                </Field>
              </div>
            </FormSection>

            {/* Coffee Chat */}
            <FormSection title="☕ Coffee Chat 受付設定">
              <label className="flex items-start gap-3 p-3 bg-paper border border-ink/15 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ccAvailable}
                  onChange={(e) =>
                    setForm({ ...form, ccAvailable: e.target.checked })
                  }
                  className="mt-1 w-5 h-5 accent-blue"
                />
                <div>
                  <p className="font-bold text-[13px] text-ink">
                    Coffee Chat の申請を受け付ける
                  </p>
                  <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
                    ON にすると、検索結果からあなたのプロフィールに「話を聞く」ボタンが表示されます。
                  </p>
                </div>
              </label>
              <Field label="相談できる内容(自由記入)">
                <textarea
                  className="field"
                  rows={4}
                  placeholder="例: 日系→現地Tech企業への転職、面接対策、給与交渉、EPビザ、Singapore生活など"
                  value={form.ccTopics}
                  onChange={(e) =>
                    setForm({ ...form, ccTopics: e.target.value })
                  }
                />
              </Field>
            </FormSection>

            {/* Career — multi-row inline editor */}
            <FormSection title="🛤 歩んできた軌跡(経歴)">
              <p className="text-[11px] text-ink-soft leading-relaxed mb-2">
                所属したすべての会社を登録できます。同じ会社で複数のポジションがあった場合は
                それぞれを別ステップとして追加してください。検索やスレッドはこの情報を元に
                クロスボーダー人材として表示します。
              </p>
              {form.career.length === 0 ? (
                <p className="text-[12px] text-ink-faint">
                  まだステップが登録されていません。下の「+ ポジションを追加」から登録してください。
                </p>
              ) : (
                <div className="space-y-3">
                  {form.career.map((step, idx) => (
                    <CareerEditorRow
                      key={step.id}
                      step={step}
                      index={idx + 1}
                      onChange={(patch) => setStep(step.id, patch)}
                      onRemove={() => removeStep(step.id)}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addBlankStep}
                className="mt-3 w-full bg-cream border border-dashed border-ink/30 hover:border-ink rounded-2xl px-4 py-3 text-[12px] font-bold text-blue transition-colors"
              >
                + ポジションを追加(複数まとめて登録可)
              </button>
            </FormSection>
          </div>

          <div className="sticky bottom-0 -mx-5 lg:-mx-7 px-5 lg:px-7 pt-3 pb-4 bg-cream/95 backdrop-blur border-t border-ink/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 py-3 bg-paper border border-ink/15 text-ink rounded-full font-bold text-[13px]"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={saveAll}
                className="btn-primary flex-1"
              >
                すべて保存する
              </button>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNavMobile />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
 * Small presentational helpers
 * ──────────────────────────────────────────────────────────── */

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
      <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint font-bold border-b border-ink/10 pb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─────────── LinkedIn-style company group card ─────────── */

function CompanyGroupCard({ group }: { group: CareerGroup }) {
  const firstLetter = (group.company.match(/[A-Za-z]/)?.[0] ?? group.company.charAt(0) ?? "—").toUpperCase();
  const isCurrent = group.steps.some((s) => s.current);
  return (
    <div className="bg-paper border border-ink/10 rounded-3xl p-4 lg:p-5 shadow-pop-sm">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-mustard text-ink font-bold flex items-center justify-center text-lg lg:text-xl border border-ink/15 display flex-shrink-0">
          {firstLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="display font-bold text-[15px] lg:text-[17px] text-ink leading-tight">
              {group.company}
            </h3>
            {isCurrent && (
              <span className="text-[9px] uppercase tracking-wider bg-blue text-cream px-1.5 py-0.5 rounded font-bold">
                現職
              </span>
            )}
          </div>
          {group.totalSpanLabel && (
            <p className="text-[11px] text-ink-soft mt-0.5">
              {group.totalSpanLabel}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pl-3 lg:pl-4 ml-5 lg:ml-6 border-l-2 border-ink/10 space-y-4">
        {group.steps.map((step) => (
          <RoleRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

function RoleRow({ step }: { step: CareerStep }) {
  const roleLabel = labelOf(ROLE_OPTS, step.role) || step.role || "—";
  const industryLabel = step.industry
    ? labelOf(INDUSTRY_OPTS, step.industry)
    : "";
  const countryLabel = step.country ? labelOf(COUNTRY_OPTS, step.country) : "";
  const span = humanizeMonths(totalMonthsFor(step));
  return (
    <div className="relative -ml-[1.4rem] lg:-ml-[1.65rem] pl-6 lg:pl-7">
      <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-cream border-2 border-blue" />
      <p className={`font-bold text-[14px] leading-tight ${step.current ? "text-blue" : "text-ink"}`}>
        {roleLabel}
      </p>
      <p className="text-[11px] text-ink-soft mt-0.5 font-semibold">
        {formatPeriod(step)}
        {span ? ` · ${span}` : ""}
      </p>
      {(industryLabel || countryLabel) && (
        <p className="text-[11px] text-ink-soft mt-0.5">
          {[countryLabel, industryLabel].filter(Boolean).join(" · ")}
        </p>
      )}
      {step.salary && (
        <p className="text-[11px] text-ink-soft mt-0.5">
          💴 {labelOf(JPY_SALARY_OPTS, step.salary)}
        </p>
      )}
      {step.achievements && (
        <p className="text-[12px] text-ink leading-relaxed mt-2 whitespace-pre-line">
          {step.achievements}
        </p>
      )}
    </div>
  );
}

/* ─────────── CC cards (extracted for readability) ─────────── */

function CcSentCard({
  r,
  busy,
  onCancel,
}: {
  r: DisplayCcRequest;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full ${r.bg} ${r.text} font-bold flex items-center justify-center text-xs border border-ink flex-shrink-0`}
          >
            {r.otherInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[13px] text-ink truncate">
              {r.otherName} さん
            </p>
            <p className="text-[10px] text-ink-soft">
              {r.postedRelative}
              {r.preferredWhen ? ` · 希望: ${r.preferredWhen}` : ""}
            </p>
          </div>
        </div>
        <span
          className={`status-badge ${
            r.status === "pending"
              ? "status-pending"
              : r.status === "approved"
                ? "status-approved"
                : r.status === "rejected"
                  ? "status-rejected"
                  : r.status === "cancelled"
                    ? "status-rejected"
                    : "status-completed"
          }`}
        >
          {r.status === "pending"
            ? "申請中"
            : r.status === "approved"
              ? "✓ 承認"
              : r.status === "rejected"
                ? "却下"
                : r.status === "cancelled"
                  ? "取消"
                  : "✓ 完了"}
        </span>
      </div>
      <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
        <span className="font-bold text-ink">相談内容:</span> {r.topic}
      </p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-ink/20">
        <p className="text-[10px] text-ink-faint">
          {new Date(r.createdAt).toLocaleDateString("ja-JP")}
        </p>
        {r.status === "pending" ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="text-[11px] text-ink-soft font-bold disabled:opacity-50"
          >
            {busy ? "..." : "取消"}
          </button>
        ) : r.status === "approved" ? (
          <Link
            href={
              r.chatRoomId
                ? `/chat?room=${r.chatRoomId}`
                : `/chat?with=${encodeURIComponent(r.otherInitials)}`
            }
            className="px-3 py-1.5 bg-ink text-cream rounded-full font-bold text-[10px]"
          >
            💬 トークルーム
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function CcReceivedCard({
  r,
  busy,
  onReject,
  onApprove,
}: {
  r: DisplayCcRequest;
  busy: boolean;
  onReject: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full ${r.bg} ${r.text} font-bold flex items-center justify-center text-xs border border-ink/15 flex-shrink-0`}
          >
            {r.otherInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[13px] text-ink truncate">
              {r.otherName} さん
            </p>
            <p className="text-[10px] text-ink-soft">{r.postedRelative}</p>
          </div>
        </div>
        {r.status === "pending" && (
          <span className="status-badge status-pending">未対応</span>
        )}
        {r.status === "approved" && (
          <span className="status-badge status-approved">✓ 承認済</span>
        )}
        {r.status === "rejected" && (
          <span className="status-badge status-rejected">却下</span>
        )}
        {(r.status === "cancelled" || r.status === "completed") && (
          <span className="status-badge status-completed">
            {r.status === "completed" ? "✓ 完了" : "取消"}
          </span>
        )}
      </div>
      <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
        <span className="font-bold text-ink">相談内容:</span> {r.topic}
      </p>
      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
        {r.status === "pending" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="px-3 py-1.5 bg-cream border border-ink/15 text-ink rounded-full font-bold text-[10px] disabled:opacity-50"
            >
              却下
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onApprove}
              className="px-3 py-1.5 bg-jade-deep text-cream rounded-full font-bold text-[10px] disabled:opacity-50"
            >
              ✓ 承認 → トークルームへ
            </button>
          </>
        ) : r.status === "approved" ? (
          <Link
            href={
              r.chatRoomId
                ? `/chat?room=${r.chatRoomId}`
                : `/chat?with=${encodeURIComponent(r.otherInitials)}`
            }
            className="px-3 py-1.5 bg-ink text-cream rounded-full font-bold text-[10px]"
          >
            💬 トークルームを開く
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DemoCcReceivedCard({
  r,
  onReject,
  onApprove,
}: {
  r: CcReceivedItem;
  onReject: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full ${r.bg} ${r.text} font-bold flex items-center justify-center text-xs border border-ink/15 flex-shrink-0`}
          >
            {r.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[13px] text-ink truncate">{r.name}</p>
            <p className="text-[10px] text-ink-soft">{r.path}</p>
          </div>
        </div>
        {r.status === "pending" && (
          <span className="status-badge status-pending">未対応</span>
        )}
        {r.status === "approved" && (
          <span className="status-badge status-approved">✓ 承認済</span>
        )}
        {r.status === "rejected" && (
          <span className="status-badge status-rejected">却下</span>
        )}
      </div>
      <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
        <span className="font-bold text-ink">相談内容:</span> {r.topic}
      </p>
      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
        {r.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={onReject}
              className="px-3 py-1.5 bg-cream border border-ink/15 text-ink rounded-full font-bold text-[10px]"
            >
              却下
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="px-3 py-1.5 bg-jade-deep text-cream rounded-full font-bold text-[10px]"
            >
              ✓ 承認 → トークルームへ
            </button>
          </>
        ) : r.status === "approved" ? (
          <Link
            href={`/chat?with=${encodeURIComponent(r.initials)}`}
            className="px-3 py-1.5 bg-ink text-cream rounded-full font-bold text-[10px]"
          >
            💬 トークルームを開く
          </Link>
        ) : null}
      </div>
    </div>
  );
}
