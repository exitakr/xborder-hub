"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
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
import { PrivacySettings } from "./PrivacySettings";
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
  COMPANY_SUGGESTIONS,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  formatPeriod,
  initials,
  useProfile,
  type CareerStep,
  type Profile,
} from "@/lib/profile/store";

type EditType = "identity" | "career" | "coffee_chat";
type CcTab = "sent" | "received";

const BLANK_CAREER_STEP: CareerStep = {
  id: "",
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

const EDIT_TITLES: Record<EditType, string> = {
  identity: "プロフィールを編集",
  career: "キャリアステップ",
  coffee_chat: "Coffee Chat の受付設定",
};

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

// Identity slice = everything on Profile except the career history array.
type Identity = Omit<Profile, "career">;

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
  const [editType, setEditType] = useState<EditType | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  // Single source of truth — persisted to localStorage and shared across
  // AppTopBar, /profile, and /search.
  const [profile, setProfile] = useProfile();
  const { career } = profile;
  const identity: Identity = profile;

  // Per-edit form state, reset to the latest committed value whenever the
  // matching modal is opened.
  const [identityForm, setIdentityForm] = useState<Identity>(identity);
  const [careerForm, setCareerForm] = useState<CareerStep>(BLANK_CAREER_STEP);
  const [ccForm, setCcForm] = useState<{
    available: boolean;
    topics: string;
  }>({
    available: profile.ccAvailable,
    topics: profile.ccTopics,
  });

  function openEdit(type: EditType, stepId?: string) {
    if (type === "identity") {
      const { career: _ignore, ...rest } = profile;
      setIdentityForm(rest);
    } else if (type === "career") {
      if (stepId) {
        const step = profile.career.find((s) => s.id === stepId);
        if (step) {
          setCareerForm({ ...step });
          setEditingStepId(stepId);
        }
      } else {
        setCareerForm({ ...BLANK_CAREER_STEP });
        setEditingStepId(null);
      }
    } else if (type === "coffee_chat") {
      setCcForm({
        available: profile.ccAvailable,
        topics: profile.ccTopics,
      });
    }
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

  function deleteCareerStep(id: string) {
    if (!confirm("このステップを削除しますか?")) return;
    setProfile((p) => ({ ...p, career: p.career.filter((s) => s.id !== id) }));
  }

  function saveEdit() {
    if (editType === "identity") {
      setProfile((p) => ({ ...p, ...identityForm }));
      // Mirror to Supabase so threads / comments / Coffee Chat show the
      // real display name. Best-effort: localStorage stays the UI source.
      void syncProfileBasics({
        displayName: identityForm.name,
        age: identityForm.age,
        bio: identityForm.bio,
        country: identityForm.country,
        city: identityForm.city,
        industry: identityForm.industry,
        role: identityForm.role,
      });
    } else if (editType === "career") {
      if (!careerForm.company.trim()) {
        setEditType(null);
        setEditingStepId(null);
        return;
      }
      if (editingStepId) {
        // Update existing step (and re-apply "current" exclusivity if turned on)
        setProfile((p) => ({
          ...p,
          career: p.career.map((s) => {
            if (s.id === editingStepId) return { ...careerForm };
            return careerForm.current ? { ...s, current: false } : s;
          }),
        }));
      } else {
        // Append new — give it an id and (if marked current) demote others.
        const newStep: CareerStep = {
          ...careerForm,
          id: `c-${Date.now()}`,
        };
        setProfile((p) => ({
          ...p,
          career: [
            ...p.career.map((s) =>
              newStep.current ? { ...s, current: false } : s,
            ),
            newStep,
          ],
        }));
      }
    } else if (editType === "coffee_chat") {
      setProfile((p) => ({
        ...p,
        ccAvailable: ccForm.available,
        ccTopics: ccForm.topics.trim(),
      }));
    }
    setEditType(null);
    setEditingStepId(null);
  }

  useEffect(() => {
    setPremium(window.localStorage.getItem("xbh_premium") === "1");
  }, []);

  function logout() {
    window.localStorage.removeItem("xbh_premium");
    startSignOut(() => signOut());
  }

  function approveCcRequest(id: string) {
    const item = ccReceived.find((r) => r.id === id);
    if (!item) return;
    setCcReceived((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    // Demo path: also drop a notification into the in-app notification feed
    // (also fires a browser push if permitted + the user opted in).
    // The DB-backed path emits a real notification row via the SQL trigger
    // configured in 0002.
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
                        {initials(identity.name, 3)}
                      </div>
                      <div>
                        <h1 className="display font-bold text-[22px] lg:text-[28px] text-ink leading-tight">
                          {identity.name || "プロフィールを設定しましょう"}
                        </h1>
                        {identity.name ? (
                          <p className="text-[12px] lg:text-[14px] text-ink-soft mt-1 font-semibold">
                            {identity.age ? `${identity.age}歳 · ` : ""}
                            {(identity.city || identity.country) &&
                              `在 ${identity.city || identity.country} `}
                            {identity.tenure}
                          </p>
                        ) : (
                          <p className="text-[12px] text-ink-soft mt-1">
                            「編集」から名前と現在地を入力すると、検索やスレッドに表示されます。
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
                      onClick={() => openEdit("identity")}
                      className="text-[11px] font-bold text-blue underline-offset-2 underline whitespace-nowrap"
                    >
                      編集
                    </button>
                  </div>

                  {identity.bio && (
                    <p className="serif-it text-[14px] lg:text-[16px] text-ink leading-relaxed mt-4 whitespace-pre-line">
                      &quot;{identity.bio}&quot;
                    </p>
                  )}

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
                    <div
                      key={r.id}
                      className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm"
                    >
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
                        <span className="font-bold text-ink">相談内容:</span>{" "}
                        {r.topic}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-ink/20">
                        <p className="text-[10px] text-ink-faint">
                          {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                        </p>
                        {r.status === "pending" ? (
                          <button
                            type="button"
                            disabled={ccBusy === r.id}
                            onClick={() =>
                              callCcAction(
                                r.id,
                                "取消",
                                cancelCoffeeChatRequest,
                              )
                            }
                            className="text-[11px] text-ink-soft font-bold disabled:opacity-50"
                          >
                            {ccBusy === r.id ? "..." : "取消"}
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
                  ))}
                </div>
              )}

              {ccTab === "sent" && dbCcSent.length === 0 && !SHOW_DEMO_CONTENT && (
                <p className="text-[12px] text-ink-faint">
                  まだ申請していません。気になる人を
                  <Link href="/search" className="text-blue font-bold underline">
                    キャリア検索
                  </Link>
                  で見つけて、Coffee Chat を申請してみましょう。
                </p>
              )}

              {ccTab === "sent" && dbCcSent.length === 0 && SHOW_DEMO_CONTENT && (
                <div className="space-y-3">
                  {/* 申請中 */}
                  <div className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue text-cream font-bold flex items-center justify-center text-xs border border-ink flex-shrink-0">
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
                  <div className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-xs border border-ink flex-shrink-0">
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
                  <div className="bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm opacity-90">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-mustard text-ink font-bold flex items-center justify-center text-xs border border-ink/15 flex-shrink-0">
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
                    </div>
                  </div>
                </div>
              )}

              {ccTab === "received" && dbCcReceived.length > 0 && (
                <div className="space-y-3">
                  {ccError && (
                    <p className="text-[11px] font-bold text-red-600">
                      {ccError}
                    </p>
                  )}
                  {dbCcReceived.map((r) => (
                    <div
                      key={r.id}
                      className="bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm"
                    >
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
                            <p className="text-[10px] text-ink-soft">
                              {r.postedRelative}
                            </p>
                          </div>
                        </div>
                        {r.status === "pending" && (
                          <span className="status-badge status-pending">
                            未対応
                          </span>
                        )}
                        {r.status === "approved" && (
                          <span className="status-badge status-approved">
                            ✓ 承認済
                          </span>
                        )}
                        {r.status === "rejected" && (
                          <span className="status-badge status-rejected">
                            却下
                          </span>
                        )}
                        {(r.status === "cancelled" ||
                          r.status === "completed") && (
                          <span className="status-badge status-completed">
                            {r.status === "completed" ? "✓ 完了" : "取消"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                        <span className="font-bold text-ink">相談内容:</span>{" "}
                        {r.topic}
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
                        {r.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={ccBusy === r.id}
                              onClick={() =>
                                callCcAction(
                                  r.id,
                                  "却下",
                                  rejectCoffeeChatRequest,
                                )
                              }
                              className="px-3 py-1.5 bg-cream border border-ink/15 text-ink rounded-full font-bold text-[10px] disabled:opacity-50"
                            >
                              却下
                            </button>
                            <button
                              type="button"
                              disabled={ccBusy === r.id}
                              onClick={async () => {
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
                      <div
                        key={r.id}
                        className="bg-cream border border-ink/10 rounded-2xl p-4 shadow-pop-sm"
                      >
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full ${r.bg} ${r.text} font-bold flex items-center justify-center text-xs border border-ink/15 flex-shrink-0`}
                            >
                              {r.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[13px] text-ink truncate">
                                {r.name}
                              </p>
                              <p className="text-[10px] text-ink-soft">
                                {r.path}
                              </p>
                            </div>
                          </div>
                          {r.status === "pending" && (
                            <span className="status-badge status-pending">
                              未対応
                            </span>
                          )}
                          {r.status === "approved" && (
                            <span className="status-badge status-approved">
                              ✓ 承認済
                            </span>
                          )}
                          {r.status === "rejected" && (
                            <span className="status-badge status-rejected">
                              却下
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                          <span className="font-bold text-ink">相談内容:</span>{" "}
                          {r.topic}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
                          {r.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => rejectCcRequest(r.id)}
                                className="px-3 py-1.5 bg-cream border border-ink/15 text-ink rounded-full font-bold text-[10px]"
                              >
                                却下
                              </button>
                              <button
                                type="button"
                                onClick={() => approveCcRequest(r.id)}
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
                    ))
                  )}
                </div>
              )}
            </section>

            {/* CAREER */}
            <section className="rise" style={{ animationDelay: "0.16s" }}>
              <div className="flex items-end justify-between mb-4">
                <h2 className="display font-bold text-[22px] lg:text-[24px] leading-tight text-ink">
                  歩んできた軌跡
                </h2>
                <button
                  type="button"
                  onClick={() => openEdit("career")}
                  className="text-[11px] font-bold text-blue"
                >
                  + ステップ追加
                </button>
              </div>

              <div className="space-y-3">
                {career.length === 0 ? (
                  <p className="text-[12px] text-ink-faint">
                    まだステップがありません。「+ ステップ追加」から登録してください。
                  </p>
                ) : (
                  career.map((step) => (
                    <div key={step.id} className="pass p-4 relative">
                      {step.current && (
                        <div className="absolute -top-2 -right-2 bg-blue text-cream text-[8px] font-bold px-2 py-1 rounded border border-ink/20 uppercase tracking-widest shadow-pop-sm">
                          現在
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`display font-bold text-[16px] ${step.current ? "text-blue" : "text-ink"}`}
                          >
                            {labelOf(COUNTRY_OPTS, step.country) ||
                              step.country ||
                              "—"}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-faint font-bold">
                          {formatPeriod(step)}
                        </span>
                      </div>
                      <p className="font-bold text-[14px] text-ink">
                        {step.company || "—"}
                      </p>
                      <p className="text-[11px] text-ink-soft mt-0.5">
                        {[
                          labelOf(INDUSTRY_OPTS, step.industry),
                          labelOf(ROLE_OPTS, step.role) || step.role,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                      {step.salary && (
                        <p className="text-[11px] text-ink-soft mt-0.5">
                          💴 {labelOf(JPY_SALARY_OPTS, step.salary)}
                        </p>
                      )}
                      {step.achievements && (
                        <p className="text-[11px] text-ink leading-relaxed mt-2 border-t border-dashed border-ink/15 pt-2 whitespace-pre-line">
                          {step.achievements}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => openEdit("career", step.id)}
                          className="text-[10px] text-blue font-bold"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCareerStep(step.id)}
                          className="text-[10px] text-plum font-bold"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Coffee Chat 受付設定 */}
            <section className="rise" style={{ animationDelay: "0.18s" }}>
              <div className="flex items-end justify-between mb-3">
                <h2 className="display font-bold text-[22px] lg:text-[24px] leading-tight text-ink">
                  ☕ Coffee Chat
                </h2>
                <button
                  type="button"
                  onClick={() => openEdit("coffee_chat")}
                  className="text-[11px] font-bold text-blue"
                >
                  編集
                </button>
              </div>
              <div className="bg-cream border border-ink/10 rounded-3xl p-4 lg:p-5 shadow-pop-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      profile.ccAvailable
                        ? "bg-jade/20 text-jade-deep border-jade/40"
                        : "bg-paper text-ink-soft border-ink/15"
                    }`}
                  >
                    {profile.ccAvailable ? "⚡ 相談受付中" : "🔒 現在は受付停止"}
                  </span>
                </div>
                {profile.ccAvailable ? (
                  profile.ccTopics ? (
                    <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">
                      {profile.ccTopics}
                    </p>
                  ) : (
                    <p className="text-[12px] text-ink-faint">
                      相談できるトピックを「編集」から登録してください。
                    </p>
                  )
                ) : (
                  <p className="text-[12px] text-ink-faint">
                    受付を有効にすると検索結果から「話を聞く」ボタンで申請が届きます。
                  </p>
                )}
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
                  className="w-full flex items-center justify-between bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm"
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
              className="w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink"
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
              <div className="space-y-3">
                <Field label="企業 (候補からも選択可)">
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Shopee"
                    list="career-company-suggestions"
                    value={careerForm.company}
                    onChange={(e) =>
                      setCareerForm((f) => ({ ...f, company: e.target.value }))
                    }
                  />
                  <datalist id="career-company-suggestions">
                    {COMPANY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="国">
                    <Select
                      value={careerForm.country}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, country: v }))
                      }
                      options={COUNTRY_OPTS}
                    />
                  </Field>
                  <Field label="業界">
                    <Select
                      value={careerForm.industry}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, industry: v }))
                      }
                      options={INDUSTRY_OPTS}
                    />
                  </Field>
                  <Field label="職種">
                    <Select
                      value={careerForm.role}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, role: v }))
                      }
                      options={ROLE_OPTS}
                    />
                  </Field>
                </div>
                <Field label="年収レンジ (任意)">
                  <Select
                    value={careerForm.salary}
                    onChange={(v) =>
                      setCareerForm((f) => ({ ...f, salary: v }))
                    }
                    options={JPY_SALARY_OPTS}
                  />
                </Field>

                <Field label="期間">
                  <div className="grid grid-cols-5 items-center gap-1.5">
                    <Select
                      value={careerForm.startYear}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, startYear: v }))
                      }
                      options={[
                        { v: "", label: "年" },
                        ...YEAR_OPTIONS.map((y) => ({ v: y, label: y })),
                      ]}
                    />
                    <Select
                      value={careerForm.startMonth}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, startMonth: v }))
                      }
                      options={[
                        { v: "", label: "月" },
                        ...MONTH_OPTIONS.map((m) => ({ v: m, label: m })),
                      ]}
                    />
                    <span className="text-center text-ink-faint font-bold">
                      〜
                    </span>
                    <Select
                      value={careerForm.endYear}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, endYear: v }))
                      }
                      options={[
                        { v: "", label: "年" },
                        ...YEAR_OPTIONS.map((y) => ({ v: y, label: y })),
                      ]}
                    />
                    <Select
                      value={careerForm.endMonth}
                      onChange={(v) =>
                        setCareerForm((f) => ({ ...f, endMonth: v }))
                      }
                      options={[
                        { v: "", label: "月" },
                        ...MONTH_OPTIONS.map((m) => ({ v: m, label: m })),
                      ]}
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-[12px] text-ink-soft cursor-pointer">
                    <input
                      type="checkbox"
                      checked={careerForm.current}
                      onChange={(e) =>
                        setCareerForm((f) => ({
                          ...f,
                          current: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-blue"
                    />
                    現在も在籍中(他のステップの「現在」フラグは自動解除)
                  </label>
                </Field>

                <Field label="実績・担当業務">
                  <textarea
                    className="field"
                    rows={4}
                    placeholder="例: 映像機器のグローバル展開を担当。最後の1年でアジア市場の責任者へ。"
                    value={careerForm.achievements}
                    onChange={(e) =>
                      setCareerForm((f) => ({
                        ...f,
                        achievements: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            )}

            {editType === "coffee_chat" && (
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3 bg-paper border border-ink/15 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ccForm.available}
                    onChange={(e) =>
                      setCcForm((f) => ({ ...f, available: e.target.checked }))
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
                    rows={5}
                    placeholder="例: 日系→現地Tech企業への転職、面接対策、給与交渉、EPビザ、Singapore生活など"
                    value={ccForm.topics}
                    onChange={(e) =>
                      setCcForm((f) => ({ ...f, topics: e.target.value }))
                    }
                  />
                  <p className="text-[10px] text-ink-faint mt-1">
                    プロフィールページと検索結果に表示されます。
                  </p>
                </Field>
              </div>
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
