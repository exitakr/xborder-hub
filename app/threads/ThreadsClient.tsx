"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { DeleteSampleButton } from "@/components/site/DeleteSampleButton";
import { requestCommunityAction } from "@/lib/communities/actions";
import { dismissSample } from "@/lib/samples/actions";
import { toggleReactionAction } from "@/app/thread/actions";
import {
  CATEGORIES,
  COUNTRIES,
  INDUSTRIES,
  LABELS,
  ROLES,
  SORTS,
  THREADS,
  type Sort,
  type Thread,
} from "./data";


export function ThreadsClient({
  isLoggedIn = false,
  dbThreads = [],
  isAdmin = false,
  dismissedKeys = [],
}: {
  isLoggedIn?: boolean;
  dbThreads?: Thread[];
  isAdmin?: boolean;
  dismissedKeys?: string[];
} = {}) {
  const router = useRouter();
  const [country, setCountry] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<Sort>("new");
  const [voted, setVoted] = useState<Record<string, "up" | "down" | null>>({});
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyKind, setApplyKind] = useState("country");
  const [applyName, setApplyName] = useState("");
  const [applyDesc, setApplyDesc] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyPending, startApply] = useTransition();

  function submitCommunityRequest(e: React.FormEvent) {
    e.preventDefault();
    setApplyError(null);
    startApply(async () => {
      const res = await requestCommunityAction({
        kind: applyKind,
        name: applyName,
        description: applyDesc,
      });
      if (res.ok) {
        setApplySuccess(true);
        setApplyName("");
        setApplyDesc("");
        setTimeout(() => {
          setApplyOpen(false);
          setApplySuccess(false);
        }, 1600);
      } else {
        setApplyError(res.error);
      }
    });
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Always show seeded samples alongside DB threads so the feed never reads
  // as empty for newcomers. Samples are tagged so the card can render a
  // visible "サンプル" badge. Admin-dismissed samples (dismissed_samples) are
  // still filtered out for all users.
  const dismissed = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);
  const dbIds = useMemo(() => new Set(dbThreads.map((t) => t.id)), [dbThreads]);
  const source = [
    ...dbThreads,
    ...THREADS.filter((s) => !dbIds.has(s.id)),
  ].filter((t) => !dismissed.has(`thread:${t.id}`));

  const [, startDismiss] = useTransition();
  function hideSample(key: string) {
    startDismiss(async () => {
      await dismissSample(key);
      router.refresh();
    });
  }

  const visible = useMemo(() => {
    let list = source.filter((t) => {
      if (country && t.country !== country) return false;
      if (industry && t.industry !== industry) return false;
      if (role && t.role !== role) return false;
      if (category && t.category !== category) return false;
      return true;
    });
    if (sort === "popular") {
      list = [...list].sort((a, b) => b.ups - a.ups);
    }
    return list;
  }, [country, industry, role, category, sort, source]);

  function toggleVote(id: string, kind: "up" | "down") {
    setVoted((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
    if (UUID_RE.test(id)) {
      void toggleReactionAction({ targetType: "thread", targetId: id, kind });
    }
  }

  function requireLoginThen(action: () => void, returnTo = "/threads") {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    action();
  }

  const activeCount = [country, industry, role, category].filter(Boolean).length;
  function clearFilters() {
    setCountry("");
    setIndustry("");
    setRole("");
    setCategory("");
  }

  return (
    <>
      <AppTopBar active="threads" />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          <div className="app-grid-main space-y-4">
            <section className="flex items-end justify-between gap-3 flex-wrap rise">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  💬 コミュニティ
                </p>
                <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
                  みんなのスレッド
                </h1>
              </div>
              <button
                type="button"
                onClick={() => requireLoginThen(() => setApplyOpen(true))}
                className="text-[11px] font-bold text-blue underline underline-offset-2"
              >
                + コミュニティを申請
              </button>
            </section>

            {/* Filter bar — 4 axes in a single dense row */}
            <section className="rise" style={{ animationDelay: "0.04s" }}>
              <div className="bg-paper border border-ink rounded-2xl p-3 lg:p-4 shadow-pop-sm">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <FilterSelect
                    label="国"
                    value={country}
                    onChange={setCountry}
                    options={COUNTRIES}
                  />
                  <FilterSelect
                    label="業界"
                    value={industry}
                    onChange={setIndustry}
                    options={INDUSTRIES}
                  />
                  <FilterSelect
                    label="職種"
                    value={role}
                    onChange={setRole}
                    options={ROLES}
                  />
                  <FilterSelect
                    label="カテゴリ"
                    value={category}
                    onChange={setCategory}
                    options={CATEGORIES}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-ink/15">
                  <p className="text-[11px] text-ink-soft font-bold">
                    {visible.length} 件のスレッド
                    {activeCount > 0 && (
                      <span className="text-ink-faint font-normal">
                        {" "}
                        · {activeCount} 件のフィルタ
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-[11px] text-ink-soft font-bold underline"
                      >
                        リセット
                      </button>
                    )}
                    <div className="inline-flex gap-0.5 p-0.5 bg-cream border border-ink/15 rounded-lg">
                      {SORTS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSort(s.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            sort === s.id
                              ? "bg-ink text-cream"
                              : "text-ink-soft"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Threads feed — flat, tight list */}
            <section className="space-y-2">
              {visible.length === 0 ? (
                <div className="bg-paper border border-ink rounded-2xl p-6 text-center shadow-pop-sm">
                  <p className="text-2xl mb-1">🪺</p>
                  <p className="display font-bold text-[14px] text-ink">
                    該当するスレッドがありません
                  </p>
                  <p className="text-[11px] text-ink-soft mt-1">
                    フィルタを変えるか、最初の一投目を書いてみませんか?
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      requireLoginThen(
                        () => router.push("/thread/new"),
                        "/thread/new",
                      )
                    }
                    className="mt-3 inline-block btn-primary text-[12px] py-2"
                  >
                    スレッドを立てる
                  </button>
                </div>
              ) : (
                visible.map((t) => (
                  <div key={t.id} className="relative">
                    {isAdmin && !UUID_RE.test(t.id) && (
                      <DeleteSampleButton
                        onClick={() => hideSample(`thread:${t.id}`)}
                      />
                    )}
                  <Link
                    href={`/thread?id=${t.id}`}
                    className="block bg-cream border border-ink/20 hover:border-ink rounded-xl p-3.5 transition-colors"
                  >
                    {/* Top: anonymous byline = 国 · 職種 · 時間 */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full ${t.bg} ${t.text} font-bold flex items-center justify-center text-[10px] border border-ink/30 flex-shrink-0`}
                        >
                          {t.author}
                        </div>
                        <p className="text-[11px] text-ink-soft truncate">
                          {[
                            t.country
                              ? LABELS.countries[t.country] ?? t.country
                              : null,
                            t.role ? LABELS.roles[t.role] ?? t.role : null,
                          ]
                            .filter(Boolean)
                            .map((s, i, arr) => (
                              <span key={i}>
                                <span className="font-bold text-ink">{s}</span>
                                {i < arr.length - 1 && (
                                  <span className="text-ink-faint"> · </span>
                                )}
                              </span>
                            ))}
                          <span className="text-ink-faint"> · {t.posted}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-ink-faint font-bold whitespace-nowrap">
                        💬 {t.replies}
                      </span>
                    </div>

                    <h3 className="display font-bold text-[15px] lg:text-[16px] text-ink leading-tight mb-1">
                      {!UUID_RE.test(t.id) && (
                        <span className="inline-block align-middle text-[9px] uppercase tracking-wider bg-ink/5 text-ink-soft px-1.5 py-0.5 rounded-full font-bold border border-ink/10 mr-1.5">
                          サンプル
                        </span>
                      )}
                      {t.title}
                    </h3>
                    <p className="text-[12px] text-ink-soft leading-relaxed line-clamp-2 mb-2">
                      {t.body}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {t.country && (
                        <Tag label={LABELS.countries[t.country] ?? t.country} />
                      )}
                      {t.industry && (
                        <Tag
                          label={LABELS.industries[t.industry] ?? t.industry}
                        />
                      )}
                      {t.role && (
                        <Tag label={LABELS.roles[t.role] ?? t.role} />
                      )}
                      <Tag
                        label={LABELS.categories[t.category] ?? t.category}
                        muted
                      />
                      <span className="text-[11px] text-ink-faint font-bold ml-auto">
                        👍 {t.ups}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isLoggedIn) {
                            router.push(
                              `/login?next=${encodeURIComponent("/threads")}`,
                            );
                            return;
                          }
                          toggleVote(t.id, "up");
                        }}
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${voted[t.id] === "up" ? "text-jade-deep" : "text-ink-faint"}`}
                      >
                        ▲
                      </button>
                    </div>
                  </Link>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Side rail */}
          <aside className="app-grid-side hidden lg:block space-y-3">
            <div className="side-nav-card">
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                よく使われるフィルタ
              </p>
              <div className="space-y-1.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setCountry("sg");
                    setIndustry("tech");
                  }}
                  className="w-full text-left font-bold text-ink flex items-center justify-between hover:text-blue transition-colors"
                >
                  <span>🇸🇬 SG × 💻 Tech</span>
                  <span className="text-ink-faint">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountry("jp");
                    setCategory("career");
                  }}
                  className="w-full text-left font-bold text-ink flex items-center justify-between hover:text-blue transition-colors"
                >
                  <span>🇯🇵 JP × 💼 キャリア</span>
                  <span className="text-ink-faint">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("pm");
                  }}
                  className="w-full text-left font-bold text-ink flex items-center justify-between hover:text-blue transition-colors"
                >
                  <span>📐 PM 全般</span>
                  <span className="text-ink-faint">→</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <button
        type="button"
        onClick={() =>
          requireLoginThen(() => router.push("/thread/new"), "/thread/new")
        }
        className="fab"
        aria-label="新しいスレッドを投稿"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <BottomNavMobile active="threads" />

      {/* Apply for new community */}
      <div
        className={`modal-overlay ${applyOpen ? "open" : ""}`}
        onClick={() => setApplyOpen(false)}
      />
      <div className={`modal-sheet ${applyOpen ? "open" : ""}`}>
        <div className="px-5 lg:px-7 pt-3 pb-6">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4 lg:hidden" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
                community request
              </p>
              <h3 className="display font-bold text-[20px] text-ink mt-1">
                コミュニティを申請
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setApplyOpen(false)}
              aria-label="閉じる"
              className="w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink"
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

          <p className="text-[12px] text-ink-soft leading-relaxed mb-4">
            コミュニティは運営側で確認のうえ開設します。すでに似た名前のコミュニティがある場合は統合をご案内することがあります。
          </p>

          <form onSubmit={submitCommunityRequest} className="space-y-3">
            <div>
              <label className="label">種別</label>
              <select
                className="filter-select"
                value={applyKind}
                onChange={(e) => setApplyKind(e.target.value)}
              >
                <option value="country">🌏 国</option>
                <option value="industry">🏢 業界</option>
                <option value="role">👤 職種</option>
              </select>
            </div>
            <div>
              <label className="label">名称 *</label>
              <input
                type="text"
                required
                className="field"
                value={applyName}
                onChange={(e) => setApplyName(e.target.value)}
                placeholder="例: 🇮🇳 India / 🎮 GameDev / 🔬 Researcher"
              />
            </div>
            <div>
              <label className="label">説明 (任意)</label>
              <textarea
                className="field"
                rows={3}
                value={applyDesc}
                onChange={(e) => setApplyDesc(e.target.value)}
                placeholder="どんな人が集まるコミュニティか、ひとことで。"
              />
            </div>
            {applyError && (
              <p className="text-[11px] font-bold text-red-600">{applyError}</p>
            )}
            {applySuccess && (
              <p className="text-[11px] font-bold text-jade-deep">
                ✓ 申請を受け付けました。運営から数日以内に連絡します。
              </p>
            )}
            <button
              type="submit"
              disabled={applyPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {applyPending ? "送信中…" : "申請を送る"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ readonly v: string; readonly label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase tracking-[0.2em] text-ink-faint font-bold block mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`filter-select !py-2 !text-[12px] ${value ? "filled" : ""}`}
      >
        <option value="">すべて</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tag({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
        muted
          ? "bg-paper text-ink-soft border-ink/15"
          : "bg-blue-soft text-blue-deep border-blue/30"
      }`}
    >
      {label}
    </span>
  );
}
