import Link from "next/link";
import type { Metadata } from "next";
import { AppHeader } from "@/components/site/AppHeader";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import { ConsultApply } from "./ConsultApply";

export const metadata: Metadata = {
  title: "YT さんのプロフィール",
};

const RIVER = [
  {
    code: "TYO",
    location: "東京 · 日本",
    years: "2014 - 2019",
    company: "Sony",
    role: "Product Manager · 5年",
    note: "映像機器のグローバル展開を担当。最後の1年でアジア市場の責任者へ。",
    variant: "default" as const,
  },
  {
    code: "SIN",
    location: "Singapore · 駐在",
    years: "2019 - 2022",
    company: "Sony Asia Pacific",
    role: "Regional PM · 3年",
    note: "日本本社からSGリージョナルへ駐在。多国籍チームでの仕事の難しさと面白さを学ぶ。",
    variant: "default" as const,
  },
  {
    code: "SIN",
    location: "Singapore · 現地採用",
    years: "2022 - 現在",
    company: "Shopee",
    role: "Senior Product Manager · 2年",
    note: "日系から現地Techへ。給与は1.7倍に。文化適応とPM職としての成長を両立中。",
    variant: "current" as const,
  },
];

const TOPICS = [
  { title: "日系→現地Techへの転職", note: "面接・給与交渉のリアル" },
  { title: "EPビザ取得", note: "日系/現地での違い" },
  { title: "英語の壁を越える", note: "PM職の実体験" },
  { title: "SG生活の現実", note: "家賃・税金・教育費" },
  { title: "PMキャリア戦略", note: "日系vs外資の進路" },
];

const SIMILAR = [
  {
    initials: "RN",
    bg: "bg-jade",
    text: "text-ink",
    name: "RN さん",
    path: "TYO(DeNA) → SIN(Grab) · 29歳 PM",
    price: "無料 →",
  },
  {
    initials: "HK",
    bg: "bg-mustard",
    text: "text-ink",
    name: "HK さん",
    path: "TYO(商社) → SIN → SGN · 42歳 起業",
    price: "SGD 80 →",
  },
];

export default function ProfilePage() {
  return (
    <>
      <AppHeader
        backHref="/search"
        title="プロフィール"
        subtitle="CAREER JOURNEY"
        trailing={
          <button
            type="button"
            className="w-9 h-9 rounded-full border-[1.5px] border-ink/15 bg-cream flex items-center justify-center text-ink"
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
            <div className="bg-paper border-[1.5px] border-ink rounded-3xl p-5 shadow-pop relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-blue opacity-15" />
              <div className="absolute -bottom-10 -left-6 w-20 h-20 rounded-full bg-mustard opacity-20" />
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-blue text-cream font-bold flex items-center justify-center text-2xl border-[1.5px] border-ink shadow-pop-sm display">
                      YT
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-jade border-[1.5px] border-ink flex items-center justify-center">
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
                  </div>
                  <div className="flex-1">
                    <h1 className="display font-bold text-[22px] text-ink leading-tight">
                      YT さん
                    </h1>
                    <p className="text-[12px] text-ink-soft mt-1 font-semibold">
                      34歳 · 在SG 3年目
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] uppercase tracking-wider bg-jade/20 text-jade-deep px-2 py-0.5 rounded-full border border-jade font-bold">
                        ⚡ 相談可
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-ink-faint font-bold">
                        ⭐ 4.9 · 23件
                      </span>
                    </div>
                  </div>
                </div>

                <p className="serif-it text-[15px] text-ink leading-relaxed">
                  &quot;日系大手から東南アジアのTech企業へ。
                  <br />
                  言葉と文化の壁を、3年で乗り越えた話なら
                  <br />
                  いつでもどうぞ。&quot;
                </p>

                <div className="mt-4 pt-4 border-t border-dashed border-ink/25">
                  <p className="text-[9px] uppercase tracking-wider text-ink-faint mb-2 font-bold">
                    🎯 次に目指す
                  </p>
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

          {/* CAREER RIVER */}
          <section className="mt-8 rise" style={{ animationDelay: "0.08s" }}>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🌊</span>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  キャリアの川
                </p>
              </div>
              <h2 className="display font-bold text-[22px] mt-1 leading-tight text-ink">
                歩んできた
                <span className="serif-it text-[26px] u-blue">軌跡</span>
              </h2>
            </div>

            <div className="space-y-5 mt-6">
              {RIVER.map((step, i) => (
                <div key={i} className="river-step">
                  <div
                    className={`river-dot ${step.variant === "current" ? "major" : ""}`}
                  />
                  <div className="pass p-4 relative">
                    {step.variant === "current" && (
                      <div className="absolute -top-2 -right-2 bg-blue text-cream text-[8px] font-bold px-2 py-1 rounded border-[1.5px] border-ink uppercase tracking-widest shadow-pop-sm">
                        現在
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`display font-bold text-[16px] ${step.variant === "current" ? "text-blue" : "text-ink"}`}
                        >
                          {step.code}
                        </span>
                        <span className="text-[11px] text-ink-soft font-bold">
                          {step.location}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-faint font-bold">
                        {step.years}
                      </span>
                    </div>
                    <p className="font-bold text-[14px] text-ink">
                      {step.company}
                    </p>
                    <p className="text-[11px] text-ink-soft mt-0.5">{step.role}</p>
                    <p className="text-[11px] text-ink-soft mt-2 leading-relaxed border-t border-dashed border-ink/20 pt-2">
                      {step.note}
                    </p>
                  </div>
                </div>
              ))}

              {/* Future */}
              <div className="river-step">
                <div className="river-dot future" />
                <div className="bg-cream border-[1.5px] border-dashed border-ink rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="display font-bold text-[16px] text-ink-faint">
                        ?
                      </span>
                      <span className="text-[11px] text-blue font-bold uppercase tracking-wider">
                        志望中
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-faint font-bold">
                      ~ 2027
                    </span>
                  </div>
                  <p className="font-bold text-[14px] text-ink">
                    US Tech Startup · VP級
                  </p>
                  <p className="text-[11px] text-ink-soft mt-2 leading-relaxed">
                    次はUSのスタートアップでVP級を狙いたい。今、英語力と業界の動向を学んでいる最中。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* TOPICS */}
          <section className="mt-10 rise" style={{ animationDelay: "0.16s" }}>
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  話せるトピック
                </p>
              </div>
              <h2 className="display font-bold text-[22px] mt-1 leading-tight text-ink">
                相談できる
                <span className="serif-it text-[26px] u-blue">内容</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TOPICS.map((t, i) => (
                <div
                  key={i}
                  className="bg-cream border-[1.5px] border-ink rounded-2xl p-3 shadow-pop-sm"
                >
                  <p className="display font-bold text-[13px] text-ink leading-tight">
                    {t.title}
                  </p>
                  <p className="text-[10px] text-ink-soft mt-1">{t.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SALARY (premium) */}
          <section className="mt-10 rise" style={{ animationDelay: "0.24s" }}>
            <div className="bg-paper border-[1.5px] border-ink rounded-3xl p-5 shadow-pop relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-mustard opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                    📊 給与レンジ
                  </p>
                  <span className="text-[9px] uppercase tracking-wider bg-ink text-mustard px-2 py-0.5 rounded-full font-bold">
                    PREMIUM
                  </span>
                </div>
                <h3 className="display font-bold text-[20px] leading-tight text-ink">
                  現職: <span className="mosaic serif-it text-[24px]">SGD 9,400</span>{" "}
                  / 月
                </h3>
                <p className="text-[11px] text-ink-soft mt-2 leading-relaxed">
                  前職比 <span className="font-bold text-ink">+72%</span> ·
                  ベース給与のみ
                  <br />
                  ※プレミアム会員限定で給与・ボーナス・株式分も閲覧可
                </p>
                <Link
                  href="/premium"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-mustard text-ink rounded-full font-bold text-[12px] border-[1.5px] border-ink shadow-pop-sm"
                >
                  詳細を見る (Premium)
                  <svg
                    width="12"
                    height="12"
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

          {/* SIMILAR PEOPLE */}
          <section className="mt-10 rise" style={{ animationDelay: "0.32s" }}>
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  似た経路の人
                </p>
              </div>
              <h2 className="display font-bold text-[22px] mt-1 leading-tight text-ink">
                この道を歩いた
                <span className="serif-it text-[26px] u-blue">他の人</span>
              </h2>
            </div>

            <div className="space-y-3">
              {SIMILAR.map((s, i) => (
                <Link
                  key={i}
                  href="/profile"
                  className="flex items-center gap-3 bg-cream border-[1.5px] border-ink rounded-2xl p-3 shadow-pop-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${s.bg} ${s.text} font-bold flex items-center justify-center text-sm border-[1.5px] border-ink flex-shrink-0`}
                  >
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-ink">{s.name}</p>
                    <p className="text-[10px] text-ink-soft mt-0.5">{s.path}</p>
                  </div>
                  <span className="text-[11px] text-ink-soft font-bold">
                    {s.price}
                  </span>
                </Link>
              ))}
            </div>
          </section>

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

      <ConsultApply />
      <BottomNavMobile />
    </>
  );
}
