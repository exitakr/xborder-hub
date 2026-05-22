"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";

type Sort = "new" | "popular" | "unsolved";
type CommunityKind = "country" | "industry" | "role";

type Community = {
  id: string;
  kind: CommunityKind;
  label: string;
  members: number;
};

const COMMUNITIES: Community[] = [
  { id: "sg", kind: "country", label: "🇸🇬 Singapore", members: 2840 },
  { id: "jp", kind: "country", label: "🇯🇵 Japan", members: 3120 },
  { id: "hk", kind: "country", label: "🇭🇰 Hong Kong", members: 1490 },
  { id: "vn", kind: "country", label: "🇻🇳 Vietnam", members: 870 },
  { id: "us", kind: "country", label: "🇺🇸 United States", members: 1310 },
  { id: "tech", kind: "industry", label: "💻 Tech", members: 4250 },
  { id: "finance", kind: "industry", label: "🏦 Finance", members: 2180 },
  { id: "startup", kind: "industry", label: "🚀 Startup", members: 1640 },
  { id: "pm", kind: "role", label: "📐 Product Manager", members: 1820 },
  { id: "eng", kind: "role", label: "⚙️ Engineer", members: 2370 },
  { id: "bd", kind: "role", label: "💼 BD / Sales", members: 1490 },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "新着" },
  { id: "popular", label: "人気" },
  { id: "unsolved", label: "未解決" },
];

type Thread = {
  id: number;
  author: string;
  bg: string;
  text: string;
  location: string;
  posted: string;
  community: string; // community id
  categoryLabel: string;
  title: string;
  body: string;
  ups: number;
  downs: number;
  replies: number;
};

const THREADS: Thread[] = [
  {
    id: 1,
    author: "RN",
    bg: "bg-blue",
    text: "text-cream",
    location: "SIN",
    posted: "2時間前",
    community: "sg",
    categoryLabel: "💼 キャリア",
    title: "SG現地Tech企業の面接、英語だけど日本語訛りでも大丈夫?",
    body: "来月Shopee/Grabの最終面接を控えています。TOEIC900はあるけど発音はバキバキの日本語訛り。皆さんどう乗り越えました?",
    ups: 23,
    downs: 1,
    replies: 14,
  },
  {
    id: 2,
    author: "HK",
    bg: "bg-mustard",
    text: "text-ink",
    location: "SGN",
    posted: "5時間前",
    community: "vn",
    categoryLabel: "👨‍👩‍👧 家族",
    title:
      "子供のインターナショナルスクール、ホーチミンで月いくらかかってますか?",
    body: "日本から移ってきたばかりで、想像の3倍くらい高くて驚いています。皆さんの実例を共有してもらえると助かります。",
    ups: 47,
    downs: 0,
    replies: 28,
  },
  {
    id: 3,
    author: "MS",
    bg: "bg-jade",
    text: "text-ink",
    location: "BKK",
    posted: "昨日",
    community: "startup",
    categoryLabel: "🛂 ビザ",
    title: "タイのSmart Visa、起業家枠の最新申請プロセス(2026年版)",
    body: "最近ルールが変わったので備忘録です。総資本金、雇用要件、ローカルパートナーの扱いなど、まとめて書きました。",
    ups: 89,
    downs: 2,
    replies: 42,
  },
  {
    id: 4,
    author: "TM",
    bg: "bg-plum",
    text: "text-cream",
    location: "TYO",
    posted: "2日前",
    community: "sg",
    categoryLabel: "💰 給与",
    title: "東京年収1,200万 vs SG SGD 11k、本当の手取り比較",
    body: "オファーをもらって悩んでいます。SGは税金安いけど家賃高い…リアルな手取りと生活費の差を計算してみました。",
    ups: 156,
    downs: 8,
    replies: 67,
  },
  {
    id: 5,
    author: "SK",
    bg: "bg-blue-soft",
    text: "text-ink",
    location: "SIN",
    posted: "3日前",
    community: "sg",
    categoryLabel: "🏠 生活",
    title: "SGのコンドミニアム、家族で住むなら結局どのエリア?",
    body: "Bukit Timah、East Coast、River Valley…日本人駐在員の定番をまとめました。価格帯と通学のしやすさで分けてます。",
    ups: 72,
    downs: 3,
    replies: 31,
  },
  {
    id: 6,
    author: "AK",
    bg: "bg-ink",
    text: "text-cream",
    location: "SIN",
    posted: "4日前",
    community: "pm",
    categoryLabel: "💼 キャリア",
    title: "外資 PM の評価制度、日系と何がどう違うか",
    body: "OKR や 360 レビューの実際の運用、昇進判定のリアルを共有します。",
    ups: 64,
    downs: 1,
    replies: 22,
  },
];

const KIND_LABEL: Record<CommunityKind, string> = {
  country: "🌏 国",
  industry: "🏢 業界",
  role: "👤 職種",
};

export function ThreadsClient() {
  const [communityId, setCommunityId] = useState<string | "all">("all");
  const [sort, setSort] = useState<Sort>("new");
  const [voted, setVoted] = useState<Record<number, "up" | "down" | null>>({
    1: "up",
    2: "up",
    3: "up",
    4: "up",
    5: "up",
    6: "up",
  });
  const [applyOpen, setApplyOpen] = useState(false);

  const visible = useMemo(
    () =>
      THREADS.filter((t) => communityId === "all" || t.community === communityId),
    [communityId],
  );

  function toggleVote(id: number, kind: "up" | "down") {
    setVoted((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
  }

  const grouped = useMemo(() => {
    const order: CommunityKind[] = ["country", "industry", "role"];
    return order.map((kind) => ({
      kind,
      label: KIND_LABEL[kind],
      items: COMMUNITIES.filter((c) => c.kind === kind),
    }));
  }, []);

  const activeCommunity =
    communityId === "all"
      ? null
      : COMMUNITIES.find((c) => c.id === communityId);

  return (
    <>
      <AppTopBar active="threads" />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          <div className="app-grid-main space-y-5">
            <section className="rise">
              <div className="flex items-end justify-between gap-3 flex-wrap">
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
                  onClick={() => setApplyOpen(true)}
                  className="text-[11px] font-bold text-blue underline underline-offset-2"
                >
                  + コミュニティを申請
                </button>
              </div>
            </section>

            {/* Community selector */}
            <section className="rise" style={{ animationDelay: "0.04s" }}>
              <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-3 lg:p-4 shadow-pop-sm space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCommunityId("all")}
                    className={`px-3 py-1.5 border-[1.5px] border-ink rounded-full text-[11px] font-bold ${
                      communityId === "all"
                        ? "bg-ink text-cream"
                        : "bg-cream text-ink"
                    }`}
                  >
                    🌐 すべて
                  </button>
                  {activeCommunity && (
                    <span className="text-[11px] text-ink-soft font-bold">
                      · {activeCommunity.label}{" "}
                      <span className="text-ink-faint">
                        ({activeCommunity.members.toLocaleString()} メンバー)
                      </span>
                    </span>
                  )}
                </div>

                {grouped.map((g) => (
                  <div key={g.kind}>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-ink-faint font-bold mt-1.5 mb-1">
                      {g.label}
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto hide-scroll">
                      {g.items.map((c) => {
                        const active = communityId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCommunityId(c.id)}
                            className={`flex-none px-2.5 py-1 rounded-full text-[11px] font-bold border-[1.5px] whitespace-nowrap ${
                              active
                                ? "bg-ink text-cream border-ink"
                                : "bg-cream text-ink border-ink/15"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sort + count */}
            <section className="flex items-center justify-between">
              <p className="text-[11px] text-ink-soft font-bold">
                {visible.length}件のスレッド
              </p>
              <div className="inline-flex gap-1 p-1 bg-paper border-[1.5px] border-ink rounded-xl shadow-pop-sm">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSort(s.id)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      sort === s.id ? "bg-ink text-cream" : "text-ink-soft"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Threads */}
            <section className="space-y-2.5">
              {visible.length === 0 ? (
                <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-6 text-center shadow-pop-sm">
                  <p className="text-2xl mb-1">🪺</p>
                  <p className="display font-bold text-[14px] text-ink">
                    まだスレッドがありません
                  </p>
                  <p className="text-[11px] text-ink-soft mt-1">
                    最初の一投目を書いてみませんか?
                  </p>
                  <Link
                    href="/thread/new"
                    className="mt-3 inline-block btn-primary text-[12px] py-2"
                  >
                    スレッドを立てる
                  </Link>
                </div>
              ) : (
                visible.map((t) => (
                  <Link
                    key={t.id}
                    href={`/thread?id=${t.id}`}
                    className="thread-card !p-3.5"
                  >
                    <div className="flex items-start justify-between mb-1.5 gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full ${t.bg} ${t.text} font-bold flex items-center justify-center text-[10px] border-[1.5px] border-ink flex-shrink-0`}
                        >
                          {t.author}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] text-ink truncate">
                            {t.author} さん · {t.location} · {t.posted}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30 flex-shrink-0">
                        {t.categoryLabel}
                      </span>
                    </div>
                    <h3 className="display font-bold text-[14px] lg:text-[15px] text-ink leading-tight mb-1">
                      {t.title}
                    </h3>
                    <p className="text-[12px] text-ink-soft leading-relaxed line-clamp-2">
                      {t.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-dashed border-ink/15">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleVote(t.id, "up");
                        }}
                        className={`vote-btn !text-[11px] !py-1 !px-2 ${voted[t.id] === "up" ? "voted-up" : ""}`}
                      >
                        👍 {t.ups}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleVote(t.id, "down");
                        }}
                        className={`vote-btn !text-[11px] !py-1 !px-2 ${voted[t.id] === "down" ? "voted-down" : ""}`}
                      >
                        👎 {t.downs}
                      </button>
                      <span className="text-[11px] text-ink-soft font-bold ml-auto">
                        💬 {t.replies}件
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </div>

          {/* Side rail */}
          <aside className="app-grid-side hidden lg:block space-y-3">
            <div className="side-nav-card">
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                人気コミュニティ
              </p>
              <div className="space-y-1.5 text-[12px]">
                {COMMUNITIES.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCommunityId(c.id)}
                    className="w-full text-left font-bold text-ink flex items-center justify-between hover:text-blue transition-colors"
                  >
                    <span>{c.label}</span>
                    <span className="text-ink-faint">
                      {c.members.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <BottomNavMobile active="threads" />

      <Link
        href="/thread/new"
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
      </Link>

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
              className="w-8 h-8 rounded-full bg-paper border-[1.5px] border-ink flex items-center justify-center text-ink"
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("申請を受け付けました(デモ)。運営から数日以内に連絡します。");
              setApplyOpen(false);
            }}
            className="space-y-3"
          >
            <div>
              <label className="label">種別</label>
              <select className="filter-select">
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
                placeholder="例: 🇮🇳 India / 🎮 GameDev / 🔬 Researcher"
              />
            </div>
            <div>
              <label className="label">説明 (任意)</label>
              <textarea
                className="field"
                rows={3}
                placeholder="どんな人が集まるコミュニティか、ひとことで。"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              申請を送る
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
