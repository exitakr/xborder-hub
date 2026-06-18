"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { initials, useProfile, type Profile } from "@/lib/profile/store";
import { LevelBadge } from "@/components/profile/LevelBadge";
import { careerLevel } from "@/lib/profile/level";
import { createCoffeeChatRequest } from "@/lib/coffee-chat/actions";
import { dismissSample } from "@/lib/samples/actions";
import { DeleteSampleButton } from "@/components/site/DeleteSampleButton";
import { track } from "@/lib/analytics/track";
import { INDUSTRY_OPTS, ROLE_OPTS } from "@/lib/profile/options";
import { SAMPLE_PEOPLE, type Person } from "./data";

/** Build a Person entry from the logged-in user's profile so they appear
 * at the top of search results alongside the sample population. */
function profileToPerson(p: Profile): Person {
  const path = p.career
    .filter((s) => s.company.trim())
    .map((s) => s.company.trim());
  const fromCity = path.length > 1 ? p.career[0]?.country ?? "—" : "—";
  const firstStep = p.career[0];
  const lastStep = p.career[p.career.length - 1];
  return {
    initials: initials(p.name, 3),
    avatarBg: "#0055A4",
    avatarText: "#FFF6E8",
    name: p.name,
    age: Number.parseInt(p.age, 10) || 30,
    tenure: `在 ${p.city || p.country} ${p.tenure || ""}`.trim(),
    from: firstStep?.country || "Japan",
    fromCity: fromCity || "Tokyo",
    to: p.country || lastStep?.country || "Singapore",
    toCity: p.city || p.country || "Singapore",
    industry: p.industry || lastStep?.industry || "Tech",
    role: p.role || lastStep?.role || "",
    companies: path.join(" → ") || "—",
    bio:
      p.ccAvailable && p.ccTopics
        ? p.ccTopics
        : p.bio || "プロフィール未設定",
    badge: p.ccAvailable ? "⚡ 相談可" : "🔒 受付停止",
    level: careerLevel(p.career),
  };
}

/** Country (as stored on Person.to) → flag emoji shown on the result card. */
const COUNTRY_FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  Singapore: "🇸🇬",
  "Hong Kong": "🇭🇰",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  "United States": "🇺🇸",
  Indonesia: "🇮🇩",
  Malaysia: "🇲🇾",
};

function countryFlag(country: string) {
  return COUNTRY_FLAGS[country] ?? "🌏";
}

const FROM_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "Japan", label: "🇯🇵 Japan" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Hong Kong", label: "🇭🇰 Hong Kong" },
  { value: "Thailand", label: "🇹🇭 Thailand" },
  { value: "Vietnam", label: "🇻🇳 Vietnam" },
  { value: "United States", label: "🇺🇸 United States" },
  { value: "Indonesia", label: "🇮🇩 Indonesia" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" },
];

const TO_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Japan", label: "🇯🇵 Japan" },
  { value: "Hong Kong", label: "🇭🇰 Hong Kong" },
  { value: "Thailand", label: "🇹🇭 Thailand" },
  { value: "Vietnam", label: "🇻🇳 Vietnam" },
  { value: "United States", label: "🇺🇸 United States" },
  { value: "Indonesia", label: "🇮🇩 Indonesia" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" },
];

const INDUSTRY_OPTIONS = [
  { value: "", label: "指定なし" },
  ...INDUSTRY_OPTS.filter((o) => o.v).map((o) => ({
    value: o.v,
    label: o.label,
  })),
];

const ROLE_OPTIONS = [
  { value: "", label: "指定なし" },
  ...ROLE_OPTS.filter((o) => o.v).map((o) => ({
    value: o.v,
    label: o.label,
  })),
];

const PAGE_SIZE = 5;
const INCREMENT = 10;

type ApplyTarget = {
  /** Present for real members → the apply persists to Supabase. */
  userId?: string;
  initials: string;
  name: string;
  route: string;
  bg: string;
  fg: string;
};

type InitialFilters = {
  from?: string;
  to?: string;
  industry?: string;
  role?: string;
};

export function SearchClient({
  isLoggedIn = false,
  initial,
  dbPeople = [],
  isAdmin = false,
  dismissedKeys = [],
}: {
  isLoggedIn?: boolean;
  initial?: InitialFilters;
  dbPeople?: Person[];
  isAdmin?: boolean;
  dismissedKeys?: string[];
} = {}) {
  const router = useRouter();
  const [profile] = useProfile();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyPending, startApply] = useTransition();

  const dismissed = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);
  function hideSample(key: string) {
    void dismissSample(key).then(() => router.refresh());
  }

  // Real members first, then the signed-in user's own card, then seeded
  // sample personas so the page never looks empty. Admins can × any
  // sample to hide it for everyone (persisted in dismissed_samples).
  const allPeople = useMemo<Person[]>(() => {
    const me = profile.name.trim() ? [profileToPerson(profile)] : [];
    const samples = SAMPLE_PEOPLE.filter((p) => p.initials !== "YT")
      .map((p): Person => ({ ...p, _sampleKey: `person:${p.initials}` }))
      .filter((p) => !dismissed.has(p._sampleKey!));
    return [...dbPeople, ...me, ...samples];
  }, [profile, dbPeople, dismissed]);

  const filtered = useMemo<Person[]>(
    () =>
      allPeople.filter((p) => {
        if (from && p.from !== from) return false;
        if (to && p.to !== to) return false;
        if (industry && p.industry !== industry) return false;
        if (role && p.role !== role) return false;
        return true;
      }),
    [allPeople, from, to, industry, role],
  );

  function applyFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setDisplayCount(PAGE_SIZE);
  }

  function reset() {
    setFrom("");
    setTo("");
    setIndustry("");
    setRole("");
    setDisplayCount(PAGE_SIZE);
  }

  function openApply(p: Person) {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/search")}`);
      return;
    }
    setApplyTarget({
      userId: p.userId,
      initials: p.initials,
      name: p.name,
      route: `${p.fromCity}→${p.toCity}`,
      bg: p.avatarBg,
      fg: p.avatarText,
    });
    setMessage("");
    setDate("");
    setApplyError(null);
  }

  function closeApply() {
    setApplyTarget(null);
    setApplyError(null);
  }

  function submitApply() {
    const trimmed = message.trim();
    if (!trimmed) {
      setApplyError("話を聞きたい内容を入力してください");
      return;
    }

    // Sample personas have no user id — keep the demo toast for them.
    if (!applyTarget?.userId) {
      closeApply();
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
      return;
    }

    setApplyError(null);
    const toUserId = applyTarget.userId;
    startApply(async () => {
      const res = await createCoffeeChatRequest({
        toUserId,
        message: trimmed,
        preferredWhen: date,
      });
      if (res.ok) {
        track("cc_request");
        closeApply();
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2500);
      } else {
        setApplyError(res.error);
      }
    });
  }

  const shown = filtered.slice(0, displayCount);

  return (
    <>
      <AppTopBar active="search" />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          <div className="app-grid-main">
            {/* Hero */}
            <section className="mb-4 rise">
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                🔀 career path search
              </p>
              <h1 className="display font-bold leading-tight tracking-tight text-ink mt-1 text-[22px] sm:text-[26px] lg:text-[28px]">
                Before → After を歩いた人を見つける
              </h1>
              <p className="text-[12px] lg:text-[13px] text-ink-soft mt-2 leading-relaxed">
                出発地・到着地・業界・職種を選ぶだけ。経験者がリストアップされます。
              </p>
            </section>

            {/* Filters */}
            <section className="mb-6 rise" style={{ animationDelay: "0.06s" }}>
              <div className="bg-paper border border-ink rounded-3xl p-4 lg:p-5 shadow-pop">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label" htmlFor="filter-from">
                      <span className="text-blue">Before</span> · 移動前の国
                    </label>
                    <select
                      id="filter-from"
                      value={from}
                      onChange={(e) => applyFilter(setFrom, e.target.value)}
                      className={`filter-select ${from ? "filled" : ""}`}
                    >
                      {FROM_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="filter-to">
                      <span className="text-blue">After</span> · 移動後の国
                    </label>
                    <select
                      id="filter-to"
                      value={to}
                      onChange={(e) => applyFilter(setTo, e.target.value)}
                      className={`filter-select ${to ? "filled" : ""}`}
                    >
                      {TO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="filter-industry">
                      業界
                    </label>
                    <select
                      id="filter-industry"
                      value={industry}
                      onChange={(e) => applyFilter(setIndustry, e.target.value)}
                      className={`filter-select ${industry ? "filled" : ""}`}
                    >
                      {INDUSTRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="filter-role">
                      職種
                    </label>
                    <select
                      id="filter-role"
                      value={role}
                      onChange={(e) => applyFilter(setRole, e.target.value)}
                      className={`filter-select ${role ? "filled" : ""}`}
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-ink/20">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[11px] text-ink-soft font-bold underline-offset-2 underline"
                  >
                    リセット
                  </button>
                  <p className="text-[11px] text-ink-soft font-bold">
                    <span className="text-ink font-bold display text-[14px]">
                      {filtered.length}
                    </span>{" "}
                    人が見つかりました
                  </p>
                </div>
              </div>
            </section>

            {/* Results */}
            <section className="rise" style={{ animationDelay: "0.12s" }}>
              {filtered.length === 0 ? (
                <div className="bg-paper border border-ink rounded-2xl p-8 text-center shadow-pop-sm">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="display font-bold text-[16px] text-ink">
                    該当する人がまだいません
                  </p>
                  <p className="text-[12px] text-ink-soft mt-2">
                    フィルタを変えるか、リセットを試してください
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shown.map((p) => (
                    <article
                      key={p.initials + p.name}
                      className="result-card bg-cream border border-ink rounded-2xl p-4 lg:p-5 shadow-pop-sm relative"
                    >
                      {isAdmin && p._sampleKey && (
                        <DeleteSampleButton
                          onClick={() => hideSample(p._sampleKey!)}
                        />
                      )}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-paper flex items-center justify-center text-[28px] lg:text-[34px] border border-ink shadow-pop-sm flex-shrink-0"
                          title={`現在: ${p.to}`}
                          aria-label={`現在の拠点: ${p.to}`}
                        >
                          {countryFlag(p.to)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[14px] text-ink">
                              {p.name}
                            </p>
                            <LevelBadge level={p.level} size="sm" />
                            <span className="text-[9px] uppercase tracking-wider bg-jade/20 text-jade-deep px-1.5 py-0.5 rounded border border-jade font-bold whitespace-nowrap">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-soft mt-0.5">
                            {p.age}歳 · {p.tenure}
                          </p>
                        </div>
                        {(p.userId || !p._sampleKey) && (
                          <Link
                            href={p.userId ? `/profile/${p.userId}` : "/profile"}
                            className="text-[11px] text-blue font-bold whitespace-nowrap"
                          >
                            詳細 →
                          </Link>
                        )}
                      </div>

                      {/* Career move — large, prominent */}
                      <div className="bg-paper border border-ink rounded-xl p-3 lg:p-4 mb-3 shadow-pop-sm">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-1.5">
                          career move
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="display font-bold text-[18px] lg:text-[22px] text-ink leading-none">
                            {p.fromCity}
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0055A4"
                            strokeWidth="2.5"
                          >
                            <path d="M5 12h14M13 5l7 7-7 7" />
                          </svg>
                          <span className="display font-bold text-[18px] lg:text-[22px] text-blue leading-none">
                            {p.toCity}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-ink-faint font-bold">
                              職種 / 業界
                            </p>
                            <p className="display font-bold text-[15px] lg:text-[16px] text-ink leading-tight mt-0.5">
                              {p.role}
                              <span className="text-ink-soft font-bold">
                                {" "}
                                · {p.industry}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-ink-faint font-bold">
                              企業遷移
                            </p>
                            <p className="display font-bold text-[14px] lg:text-[15px] text-ink leading-tight mt-0.5">
                              {p.companies}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-ink leading-relaxed mb-3">
                        {p.bio}
                      </p>

                      <div className="flex items-center justify-end pt-3 border-t border-dashed border-ink/15">
                        <button
                          type="button"
                          onClick={() => openApply(p)}
                          className="px-4 py-2 bg-ink text-cream rounded-full font-bold text-[11px] shadow-pop-sm"
                        >
                          話を聞く →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {filtered.length > displayCount && (
                <div className="mt-5 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDisplayCount((c) => c + INCREMENT)}
                    className="px-6 py-3 bg-cream border border-ink rounded-full text-[13px] font-bold shadow-pop-sm text-ink"
                  >
                    もっと見る
                  </button>
                </div>
              )}
            </section>

            {/* Salaries CTA — give-to-get model: contribute to unlock */}
            <section className="mt-10 rise" style={{ animationDelay: "0.18s" }}>
              <div className="bg-ink text-cream border border-ink rounded-3xl p-5 lg:p-7 shadow-pop-blue relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-mustard opacity-20" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-mustard text-ink rounded-full px-2 py-1 mb-3">
                    <span>💴</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold">
                      REAL NUMBERS
                    </span>
                  </div>
                  <h3 className="display font-bold text-[20px] lg:text-[24px] leading-tight">
                    リアルな年収・家賃・ビザを見る
                  </h3>
                  <p className="text-[12px] opacity-80 mt-2 leading-relaxed">
                    匿名で 1 件投稿すると、全てのデータが見られるようになります。
                  </p>
                  <Link
                    href="/salaries"
                    className="mt-4 inline-flex items-center gap-2 bg-mustard text-ink rounded-full px-5 py-2.5 font-bold text-[13px]"
                  >
                    年収データを見る
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Side */}
          <aside className="app-grid-side hidden lg:block space-y-4">
            <div className="side-nav-card">
              <p className="text-[10px] uppercase tracking-[0.24em] text-blue font-bold mb-2">
                人気の経路
              </p>
              <div className="space-y-2 text-[12px]">
                <p className="font-bold text-ink flex items-center justify-between">
                  Japan → Singapore{" "}
                  <span className="text-jade-deep">128人</span>
                </p>
                <p className="font-bold text-ink flex items-center justify-between">
                  Japan → United States{" "}
                  <span className="text-jade-deep">63人</span>
                </p>
                <p className="font-bold text-ink flex items-center justify-between">
                  Singapore → Vietnam{" "}
                  <span className="text-jade-deep">42人</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Apply modal */}
      <div
        className={`modal-overlay ${applyTarget ? "open" : ""}`}
        onClick={closeApply}
      />
      <div className={`modal-sheet ${applyTarget ? "open" : ""}`}>
        <div className="px-5 pt-2">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
                Coffee Chat申請
              </p>
              <h3 className="display font-bold text-[20px] text-ink mt-1">
                話を聞きたい
              </h3>
            </div>
            <button
              type="button"
              onClick={closeApply}
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

          <div className="bg-paper border border-ink rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm border border-ink flex-shrink-0"
              style={{
                background: applyTarget?.bg ?? "#0055A4",
                color: applyTarget?.fg ?? "#FFF6E8",
              }}
            >
              {applyTarget?.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[14px] text-ink">
                {applyTarget?.name}
              </p>
              <p className="text-[11px] text-ink-soft">{applyTarget?.route}</p>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <div>
              <label className="label" htmlFor="apply-message">
                話を聞きたい内容 *
              </label>
              <textarea
                id="apply-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field"
                rows={5}
                placeholder="例: SG現地Tech企業への転職活動の進め方について、面接対策と給与交渉のコツを伺いたいです。"
                maxLength={500}
              />
              <p className="text-[10px] text-ink-faint mt-1 text-right">
                {message.length} / 500
              </p>
            </div>

            <div>
              <label className="label" htmlFor="apply-date">
                希望日時(任意)
              </label>
              <input
                id="apply-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="text"
                className="field"
                placeholder="例: 平日夜 / 週末午後"
              />
            </div>

            <div className="bg-paper border border-ink rounded-xl p-3">
              <p className="text-[11px] font-bold text-ink mb-1">📌 申請の流れ</p>
              <ol className="text-[11px] text-ink-soft space-y-0.5 pl-4 list-decimal">
                <li>相手が内容を確認</li>
                <li>承認されたらトークルームが開きます</li>
                <li>日時を決めて実施</li>
              </ol>
            </div>
          </div>

          {applyError && (
            <p className="text-[11px] font-bold text-red-600 mb-2">
              {applyError}
            </p>
          )}
          <button
            type="button"
            onClick={submitApply}
            disabled={applyPending}
            className="btn-primary w-full mb-4 disabled:opacity-50"
          >
            {applyPending ? "送信中…" : "申請を送る"}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-jade-deep text-cream rounded-full px-5 py-3 shadow-pop-lg border border-ink font-bold text-[13px] pointer-events-none transition-opacity duration-300"
        style={{ opacity: toastVisible ? 1 : 0 }}
      >
        ✓ 申請を送りました
      </div>

      <BottomNavMobile active="search" />
    </>
  );
}
