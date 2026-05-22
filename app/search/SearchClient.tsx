"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { SAMPLE_PEOPLE, type Person } from "./data";

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
  { value: "Tech", label: "💻 Tech" },
  { value: "Finance", label: "🏦 Finance" },
  { value: "Startup", label: "🚀 Startup" },
  { value: "Manufacturing", label: "🏭 Manufacturing" },
  { value: "Consumer", label: "🛍 Consumer" },
  { value: "Healthcare", label: "🏥 Healthcare" },
  { value: "Education", label: "🎓 Education" },
];

const ROLE_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "Product Manager", label: "📐 Product Manager" },
  { value: "Engineer", label: "⚙️ Engineer" },
  { value: "BD / Sales", label: "💼 BD / Sales" },
  { value: "Marketing", label: "📣 Marketing" },
  { value: "Designer", label: "🎨 Designer" },
  { value: "Finance / Accounting", label: "📊 Finance / Accounting" },
  { value: "HR / People", label: "👥 HR / People" },
  { value: "駐在帯同(無職)", label: "🏠 駐在帯同(無職)" },
];

const PAGE_SIZE = 5;
const INCREMENT = 10;

type ApplyTarget = {
  initials: string;
  name: string;
  route: string;
  bg: string;
  fg: string;
};

export function SearchClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const filtered = useMemo<Person[]>(
    () =>
      SAMPLE_PEOPLE.filter((p) => {
        if (from && p.from !== from) return false;
        if (to && p.to !== to) return false;
        if (industry && p.industry !== industry) return false;
        if (role && p.role !== role) return false;
        return true;
      }),
    [from, to, industry, role],
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
    setApplyTarget({
      initials: p.initials,
      name: p.name,
      route: `${p.fromCity}→${p.toCity}`,
      bg: p.avatarBg,
      fg: p.avatarText,
    });
    setMessage("");
    setDate("");
  }

  function closeApply() {
    setApplyTarget(null);
  }

  function submitApply() {
    if (!message.trim()) {
      alert("話を聞きたい内容を入力してください");
      return;
    }
    closeApply();
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
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
              <div className="bg-paper border-[1.5px] border-ink rounded-3xl p-4 lg:p-5 shadow-pop">
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
                <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-8 text-center shadow-pop-sm">
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
                      className="result-card bg-cream border-[1.5px] border-ink rounded-2xl p-4 lg:p-5 shadow-pop-sm"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm border-[1.5px] border-ink shadow-pop-sm flex-shrink-0"
                          style={{
                            background: p.avatarBg,
                            color: p.avatarText,
                          }}
                        >
                          {p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[14px] text-ink">
                              {p.name}
                            </p>
                            <span className="text-[9px] uppercase tracking-wider bg-jade/20 text-jade-deep px-1.5 py-0.5 rounded border border-jade font-bold whitespace-nowrap">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-soft mt-0.5">
                            {p.age}歳 · {p.tenure}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="text-[11px] text-blue font-bold whitespace-nowrap"
                        >
                          詳細 →
                        </Link>
                      </div>

                      <div className="bg-paper border border-ink/20 rounded-xl p-2.5 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="display font-bold text-[14px] text-ink">
                            {p.fromCity}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0055A4"
                            strokeWidth="2.5"
                          >
                            <path d="M5 12h14M13 5l7 7-7 7" />
                          </svg>
                          <span className="display font-bold text-[14px] text-blue">
                            {p.toCity}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-ink mt-1.5">
                          {p.industry} · {p.role}
                        </p>
                        <p className="text-[11px] text-ink-soft mt-0.5">
                          {p.companies}
                        </p>
                      </div>

                      <p className="text-[12px] text-ink leading-relaxed mb-3">
                        {p.bio}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-ink/15">
                        <span className="text-[10px] text-ink-faint font-bold">
                          ⭐ {p.rating} · {p.sessions}件
                        </span>
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
                    className="px-6 py-3 bg-cream border-[1.5px] border-ink rounded-full text-[13px] font-bold shadow-pop-sm text-ink"
                  >
                    もっと見る
                  </button>
                </div>
              )}
            </section>

            {/* Premium CTA */}
            <section className="mt-10 rise" style={{ animationDelay: "0.18s" }}>
              <div className="bg-ink text-cream border-[1.5px] border-ink rounded-3xl p-5 lg:p-7 shadow-pop-blue relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-mustard opacity-20" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-mustard text-ink rounded-full px-2 py-1 mb-3">
                    <span>✦</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold">
                      PREMIUM
                    </span>
                  </div>
                  <h3 className="display font-bold text-[20px] lg:text-[24px] leading-tight">
                    給与の本当の数字を見る
                  </h3>
                  <p className="text-[12px] opacity-80 mt-2 leading-relaxed">
                    中央値・四分位・ボーナス・株式まで。先に行った人のリアルな手取りを公開。
                  </p>
                  <Link
                    href="/premium"
                    className="mt-4 inline-flex items-center gap-2 bg-mustard text-ink rounded-full px-5 py-2.5 font-bold text-[13px]"
                  >
                    給与データを見る
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

          <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm border-[1.5px] border-ink flex-shrink-0"
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

            <div className="bg-paper border-[1.5px] border-ink rounded-xl p-3">
              <p className="text-[11px] font-bold text-ink mb-1">📌 申請の流れ</p>
              <ol className="text-[11px] text-ink-soft space-y-0.5 pl-4 list-decimal">
                <li>相手が内容を確認</li>
                <li>承認されたらトークルームが開きます</li>
                <li>日時を決めて実施</li>
              </ol>
            </div>
          </div>

          <button
            type="button"
            onClick={submitApply}
            className="btn-primary w-full mb-4"
          >
            申請を送る
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
        className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-jade-deep text-cream rounded-full px-5 py-3 shadow-pop-lg border-[1.5px] border-ink font-bold text-[13px] pointer-events-none transition-opacity duration-300"
        style={{ opacity: toastVisible ? 1 : 0 }}
      >
        ✓ 申請を送りました
      </div>

      <BottomNavMobile active="search" />
    </>
  );
}
