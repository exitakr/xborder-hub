import type { Metadata } from "next";
import { LandingHeader } from "@/components/site/LandingHeader";
import { SubscribeButton } from "./SubscribeButton";

export const metadata: Metadata = {
  title: "Premium会員",
};

const UNLOCKS = [
  {
    emoji: "💰",
    title: "給与の中央値と分布",
    body: "国・業界・職種ごとの実数。中央値・上位25%・下位25%まで。",
  },
  {
    emoji: "📈",
    title: "ボーナス・株式",
    body: "RSU・SO・サインオン含む、トータルパッケージの実態。",
  },
  {
    emoji: "🏥",
    title: "福利厚生・税制",
    body: "医療保険、教育補助、税金、リアルな手取りの数字。",
  },
  {
    emoji: "🎯",
    title: "経路インサイト",
    body: "A→B移動による給与変化、成長スピード、定着率データ。",
  },
];

const FAQS = [
  {
    q: "解約はいつでもできますか?",
    a: "はい、いつでも解約可能です。解約後も期間終了までは全機能をご利用いただけます。",
  },
  {
    q: "無料トライアル期間は?",
    a: "初月(30日間)は完全無料です。トライアル中に解約すれば料金は発生しません。",
  },
  {
    q: "給与データはどのように収集されていますか?",
    a: "会員が匿名で入力した実データに基づきます。個人特定はできない形で集計・公開されます。",
  },
];

export default function PremiumPage() {
  return (
    <>
      <LandingHeader />

      <main className="relative z-10 py-8 lg:py-16">
        <div className="container-app">
          <div className="max-w-3xl mx-auto">
            {/* Hero */}
            <section className="text-center mb-10 rise">
              <div className="inline-flex items-center gap-2 bg-ink text-mustard rounded-full px-3 py-1.5 border border-ink shadow-pop-sm mb-5">
                <span>✦</span>
                <span className="text-[10px] uppercase tracking-[0.22em] font-bold">
                  PREMIUM MEMBERSHIP
                </span>
              </div>
              <h1 className="display font-bold text-[32px] lg:text-[44px] leading-[1.1] text-ink">
                もっと深く、
                <br className="lg:hidden" />
                <span className="serif-it text-[36px] lg:text-[48px] u-blue">
                  本物の数字
                </span>
                に触れる
              </h1>
              <p className="mt-5 text-[14px] lg:text-[16px] text-ink-soft leading-relaxed max-w-xl mx-auto">
                海外で本当に必要な情報は、表に出てこない。
                <br />
                Premium会員なら、リアルな給与・株式・福利厚生まで、
                <br />
                先に行った人の全データに触れられます。
              </p>
            </section>

            {/* Plans */}
            <section
              className="grid lg:grid-cols-2 gap-5 mb-10 rise"
              style={{ animationDelay: "0.08s" }}
            >
              {/* Free */}
              <div className="bg-cream border border-ink rounded-3xl p-6 shadow-pop-sm">
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold mb-2">
                  FREE
                </div>
                <p className="display font-bold text-[22px] text-ink">
                  無料プラン
                </p>
                <div className="mt-3">
                  <span className="display font-bold text-[40px] text-ink">
                    SGD 0
                  </span>
                  <span className="text-[12px] text-ink-faint font-bold">
                    / 月
                  </span>
                </div>
                <p className="text-[12px] text-ink-soft mt-2">
                  基本機能だけで始める
                </p>

                <ul className="mt-5 space-y-2.5">
                  {[
                    "キャリアの軌跡を残す",
                    "フロー検索(基本)",
                    "Coffee Chat申請(月3件まで)",
                    "スレッド閲覧・投稿",
                    "年収データ(投稿すると閲覧解放)",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px]"
                    >
                      <span className="text-jade-deep font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {["給与の集計・分布分析", "経路インサイト"].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] text-ink-faint"
                    >
                      <span>✗</span>
                      <span className="line-through">{item}</span>
                    </li>
                  ))}
                </ul>

                <button type="button" className="mt-6 btn-secondary w-full">
                  現在のプラン
                </button>
              </div>

              {/* Premium */}
              <div className="bg-ink text-cream border border-ink rounded-3xl p-6 shadow-pop-blue relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-mustard opacity-25" />
                <div className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full bg-blue opacity-30" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-mustard font-bold">
                      PREMIUM ✦
                    </div>
                    <span className="bg-mustard text-ink text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="display font-bold text-[22px]">プレミアム</p>
                  <div className="mt-3">
                    <span className="display font-bold text-[40px] text-mustard">
                      SGD 12
                    </span>
                    <span className="text-[12px] opacity-70 font-bold">
                      / 月
                    </span>
                  </div>
                  <p className="text-[12px] opacity-80 mt-2">
                    初月無料 · いつでも解約可能
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>無料プランの全機能</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>
                        <b>給与レンジ詳細</b>(中央値・四分位)
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>
                        <b>ボーナス・株式</b>情報
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>福利厚生・税制データ</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>
                        Coffee Chat申請 <b>無制限</b>
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>高度なフィルタ・経路分析</span>
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="text-mustard font-bold">✓</span>
                      <span>限定スレッド・QA優先表示</span>
                    </li>
                  </ul>

                  <SubscribeButton className="mt-6 w-full py-3.5 bg-mustard text-ink rounded-full font-bold text-[14px] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform">
                    無料トライアルを開始 →
                  </SubscribeButton>
                  <p className="text-[10px] opacity-70 text-center mt-3">
                    初月無料 · いつでも解約可能 · クレジットカード必要
                  </p>
                </div>
              </div>
            </section>

            {/* What you unlock */}
            <section
              className="mb-10 rise"
              style={{ animationDelay: "0.16s" }}
            >
              <h2 className="display font-bold text-[22px] lg:text-[28px] leading-tight text-ink text-center mb-6">
                Premiumで
                <span className="serif-it text-[26px] lg:text-[32px] u-blue">
                  見えるもの
                </span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {UNLOCKS.map((u) => (
                  <div
                    key={u.title}
                    className="bg-paper border border-ink rounded-2xl p-5 shadow-pop-sm"
                  >
                    <div className="text-2xl mb-2">{u.emoji}</div>
                    <p className="display font-bold text-[16px] text-ink">
                      {u.title}
                    </p>
                    <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed">
                      {u.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="rise" style={{ animationDelay: "0.24s" }}>
              <h2 className="display font-bold text-[22px] lg:text-[26px] leading-tight text-ink mb-5 text-center">
                よくある質問
              </h2>
              <div className="space-y-3">
                {FAQS.map((faq) => (
                  <details
                    key={faq.q}
                    className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm"
                  >
                    <summary className="flex items-start justify-between gap-3">
                      <span className="display font-bold text-[14px] text-ink leading-tight">
                        {faq.q}
                      </span>
                      <span className="faq-arrow text-blue text-xl font-bold leading-none">
                        +
                      </span>
                    </summary>
                    <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="mt-12 text-center">
              <SubscribeButton className="btn-primary text-[15px] px-8 py-4">
                ✦ 無料トライアルを開始
              </SubscribeButton>
              <p className="text-[11px] text-ink-faint mt-3">
                初月無料 · SGD 12/月 · いつでも解約
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
