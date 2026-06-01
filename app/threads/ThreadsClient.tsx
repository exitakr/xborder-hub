"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";

type Sort = "new" | "popular";

const COUNTRIES = [
  { v: "sg", label: "🇸🇬 Singapore" },
  { v: "jp", label: "🇯🇵 Japan" },
  { v: "hk", label: "🇭🇰 Hong Kong" },
  { v: "vn", label: "🇻🇳 Vietnam" },
  { v: "th", label: "🇹🇭 Thailand" },
  { v: "us", label: "🇺🇸 United States" },
];

const INDUSTRIES = [
  { v: "tech", label: "💻 Tech" },
  { v: "finance", label: "🏦 Finance" },
  { v: "startup", label: "🚀 Startup" },
  { v: "consumer", label: "🛍 Consumer" },
  { v: "manufacturing", label: "🏭 Manufacturing" },
];

const ROLES = [
  { v: "pm", label: "📐 PM" },
  { v: "eng", label: "⚙️ Engineer" },
  { v: "bd", label: "💼 BD / Sales" },
  { v: "marketing", label: "📣 Marketing" },
  { v: "design", label: "🎨 Design" },
];

const CATEGORIES = [
  { v: "career", label: "💼 キャリア" },
  { v: "life", label: "🏠 生活" },
  { v: "visa", label: "🛂 ビザ" },
  { v: "salary", label: "💰 給与" },
  { v: "family", label: "👨‍👩‍👧 家族" },
  { v: "other", label: "💬 その他" },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "新着" },
  { id: "popular", label: "人気" },
];

type Thread = {
  id: number;
  author: string;
  bg: string;
  text: string;
  location: string;
  posted: string;
  // Multi-axis taxonomy
  country: string; // matches COUNTRIES.v
  industry: string;
  role: string;
  category: string;
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
    country: "sg",
    industry: "tech",
    role: "eng",
    category: "career",
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
    country: "vn",
    industry: "startup",
    role: "bd",
    category: "family",
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
    country: "th",
    industry: "startup",
    role: "bd",
    category: "visa",
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
    country: "sg",
    industry: "tech",
    role: "pm",
    category: "salary",
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
    country: "sg",
    industry: "consumer",
    role: "marketing",
    category: "life",
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
    country: "sg",
    industry: "tech",
    role: "pm",
    category: "career",
    title: "外資 PM の評価制度、日系と何がどう違うか",
    body: "OKR や 360 レビューの実際の運用、昇進判定のリアルを共有します。",
    ups: 64,
    downs: 1,
    replies: 22,
  },
  {
    id: 7,
    author: "JN",
    bg: "bg-blue",
    text: "text-cream",
    location: "SFO",
    posted: "5日前",
    country: "us",
    industry: "tech",
    role: "eng",
    category: "visa",
    title: "H1B 抽選を待たずに US Tech に行く方法は本当にあるか",
    body: "L-1B / O-1 / TN(カナダ国籍向け)を実際に取った 3 名の方法をまとめました。",
    ups: 41,
    downs: 0,
    replies: 17,
  },
];

const LABELS = {
  countries: Object.fromEntries(COUNTRIES.map((c) => [c.v, c.label])),
  industries: Object.fromEntries(INDUSTRIES.map((c) => [c.v, c.label])),
  roles: Object.fromEntries(ROLES.map((c) => [c.v, c.label])),
  categories: Object.fromEntries(CATEGORIES.map((c) => [c.v, c.label])),
};

export function ThreadsClient({
  isLoggedIn = false,
}: { isLoggedIn?: boolean } = {}) {
  const router = useRouter();
  const [country, setCountry] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<Sort>("new");
  const [voted, setVoted] = useState<Record<number, "up" | "down" | null>>({
    1: "up",
    2: "up",
    3: "up",
    4: "up",
    5: "up",
    6: "up",
    7: "up",
  });
  const [applyOpen, setApplyOpen] = useState(false);

  const visible = useMemo(() => {
    let list = THREADS.filter((t) => {
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
  }, [country, industry, role, category, sort]);

  function toggleVote(id: number, kind: "up" | "down") {
    setVoted((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
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
              <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-3 lg:p-4 shadow-pop-sm">
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
                <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-6 text-center shadow-pop-sm">
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
                  <Link
                    key={t.id}
                    href={`/thread?id=${t.id}`}
                    className="block bg-cream border border-ink/20 hover:border-ink rounded-xl p-3.5 transition-colors"
                  >
                    {/* Top: author + tag chips */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full ${t.bg} ${t.text} font-bold flex items-center justify-center text-[10px] border border-ink/30 flex-shrink-0`}
                        >
                          {t.author}
                        </div>
                        <p className="text-[11px] text-ink-soft truncate">
                          <span className="font-bold text-ink">{t.author}</span>
                          <span className="text-ink-faint">
                            {" "}
                            · {t.location} · {t.posted}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] text-ink-faint font-bold whitespace-nowrap">
                        💬 {t.replies}
                      </span>
                    </div>

                    <h3 className="display font-bold text-[15px] lg:text-[16px] text-ink leading-tight mb-1">
                      {t.title}
                    </h3>
                    <p className="text-[12px] text-ink-soft leading-relaxed line-clamp-2 mb-2">
                      {t.body}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag label={LABELS.countries[t.country]} />
                      <Tag label={LABELS.industries[t.industry]} />
                      <Tag label={LABELS.roles[t.role]} />
                      <Tag label={LABELS.categories[t.category]} muted />
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
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
