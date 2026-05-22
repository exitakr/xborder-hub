"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { SideNavMenu } from "@/components/site/SideNavMenu";
import { signOut } from "@/app/login/actions";

type EditType = "identity" | "goals" | "career";
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
  identity: "基本情報を編集",
  goals: "次に目指すゴールを編集",
  career: "キャリアステップを追加",
};

export function MyPageClient() {
  const [ccTab, setCcTab] = useState<CcTab>("sent");
  const [editType, setEditType] = useState<EditType | null>(null);
  const [premium, setPremium] = useState(false);
  const [signingOut, startSignOut] = useTransition();

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
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
        <div className="container-app py-3.5 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div className="display font-bold text-[15px] leading-none tracking-tight text-ink">
                X Border Hub
              </div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
                crossing borders
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              About
            </Link>
            <Link
              href="/home"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              ホーム
            </Link>
            <Link
              href="/search"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              フロー検索
            </Link>
            <Link
              href="/threads"
              className="hidden lg:inline text-[12px] font-bold text-ink-soft px-3 py-2"
            >
              スレッド
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={signingOut}
              className="text-[11px] font-bold text-ink-soft px-2 py-1.5 disabled:opacity-50"
            >
              {signingOut ? "ログアウト中…" : "ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="container-app py-6 lg:py-10 relative z-10 pb-24 lg:pb-10">
        <div className="app-grid">
          {/* MAIN */}
          <div className="app-grid-main space-y-8">
            {/* IDENTITY */}
            <section className="rise">
              <div className="bg-paper border-[1.5px] border-ink rounded-3xl p-5 lg:p-7 shadow-pop relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue opacity-15" />
                <div className="absolute -bottom-12 -left-6 w-24 h-24 rounded-full bg-mustard opacity-20" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-blue text-cream font-bold flex items-center justify-center text-2xl lg:text-3xl border-[1.5px] border-ink shadow-pop-sm display">
                        YT
                      </div>
                      <div>
                        <h1 className="display font-bold text-[22px] lg:text-[28px] text-ink leading-tight">
                          YT さん
                        </h1>
                        <p className="text-[12px] lg:text-[14px] text-ink-soft mt-1 font-semibold">
                          34歳 · 在SG 3年目
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wider bg-jade/20 text-jade-deep px-2 py-0.5 rounded-full border border-jade font-bold">
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
                      onClick={() => setEditType("identity")}
                      className="text-[11px] font-bold text-blue underline-offset-2 underline whitespace-nowrap"
                    >
                      編集
                    </button>
                  </div>

                  <p className="serif-it text-[14px] lg:text-[16px] text-ink leading-relaxed mt-4">
                    &quot;日系大手から東南アジアのTech企業へ。
                    <br />
                    言葉と文化の壁を、3年で乗り越えた話なら
                    <br />
                    いつでもどうぞ。&quot;
                  </p>

                  <div className="mt-5 pt-4 border-t border-dashed border-ink/25">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] uppercase tracking-wider text-ink-faint font-bold">
                        🎯 次に目指す
                      </p>
                      <button
                        type="button"
                        onClick={() => setEditType("goals")}
                        className="text-[10px] text-blue font-bold"
                      >
                        編集
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 bg-blue-soft border border-ink rounded-full font-bold text-ink">
                        🇺🇸 US
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-mustard border border-ink rounded-full font-bold text-ink">
                        🚀 Startup
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-jade border border-ink rounded-full font-bold text-ink">
                        VP級
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-cream border-[1.5px] border-ink rounded-full font-bold text-ink">
                        Tech
                      </span>
                    </div>
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
                  onClick={() => setEditType("career")}
                  className="text-[11px] font-bold text-blue"
                >
                  + ステップ追加
                </button>
              </div>

              <div className="space-y-3">
                {CAREER.map((step, i) => (
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
            <SideNavMenu active="mypage" />
            <div
              className="side-nav-card mt-4 bg-ink text-cream"
              style={{ background: "#0A1F3D" }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-mustard font-bold mb-2">
                ✦ Premium
              </p>
              <p className="display font-bold text-[15px] leading-tight text-cream">
                給与データを
                <br />
                すべて見る
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

          <div className="pb-6 space-y-4">
            {editType === "identity" && (
              <>
                <div>
                  <label className="label" htmlFor="f-name">
                    表示名
                  </label>
                  <input
                    id="f-name"
                    type="text"
                    className="field"
                    defaultValue="YT さん"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="f-age">
                    年齢
                  </label>
                  <input
                    id="f-age"
                    type="number"
                    className="field"
                    defaultValue={34}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="f-location">
                    現在地
                  </label>
                  <input
                    id="f-location"
                    type="text"
                    className="field"
                    defaultValue="Singapore"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="f-tenure">
                    滞在年数
                  </label>
                  <input
                    id="f-tenure"
                    type="text"
                    className="field"
                    defaultValue="3年目"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="f-bio">
                    自己紹介
                  </label>
                  <textarea
                    id="f-bio"
                    className="field"
                    rows={4}
                    defaultValue="日系大手から東南アジアのTech企業へ。言葉と文化の壁を、3年で乗り越えた話なら、いつでもどうぞ。"
                  />
                </div>
              </>
            )}

            {editType === "goals" && (
              <>
                <p className="text-[12px] text-ink-soft">
                  カンマ区切りで入力(例: 🇺🇸 US, Startup, VP級)
                </p>
                <input
                  type="text"
                  className="field"
                  defaultValue="🇺🇸 US, 🚀 Startup, VP級, Tech"
                />
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
                  />
                </div>
                <div>
                  <label className="label">会社</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Shopee"
                  />
                </div>
                <div>
                  <label className="label">役職</label>
                  <input
                    type="text"
                    className="field"
                    placeholder="例: Senior Product Manager"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">開始年</label>
                    <input
                      type="number"
                      className="field"
                      placeholder="2022"
                    />
                  </div>
                  <div>
                    <label className="label">終了年</label>
                    <input type="text" className="field" placeholder="現在" />
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditType(null)}
            className="btn-primary w-full mb-4"
          >
            保存する
          </button>
        </div>
      </div>

      <BottomNavMobile active="mypage" />
    </>
  );
}
