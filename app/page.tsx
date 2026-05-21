import Link from "next/link";
import { LandingHeader } from "@/components/site/LandingHeader";
import { LandingFooter } from "@/components/site/LandingFooter";

const FEARS = [
  {
    emoji: "😟",
    title: (
      <>
        &quot;このまま海外に行って、
        <br />
        通用するのか?&quot;
      </>
    ),
    note: "比較対象がないから、自信が持てない。",
  },
  {
    emoji: "🤔",
    title: (
      <>
        &quot;何から始めればいいのか、
        <br />
        分からない&quot;
      </>
    ),
    note: "道順を示してくれる存在がいない。",
  },
  {
    emoji: "👤",
    title: (
      <>
        &quot;周りに、
        <br />
        ロールモデルがいない&quot;
      </>
    ),
    note: "同じ道を歩いた人を、知る術がない。",
  },
  {
    emoji: "⚠️",
    title: (
      <>
        &quot;失敗したら、
        <br />
        取り返しがつかない気がする&quot;
      </>
    ),
    note: "失敗事例が見えない。だから、踏み出せない。",
  },
];

const ANSWERS = [
  {
    emoji: "🗺",
    title: "本物のキャリア軌跡が見える",
    body: "A国→B国へ動いた人を検索し、話を聞ける。",
  },
  {
    emoji: "💬",
    title: "先輩の知恵が、直接届く",
    body: "同じ業界・職種で先行した人に、直接相談できる。",
  },
  {
    emoji: "📊",
    title: "リアルな給与・生活コスト",
    body: "推測ではなく、実際の数字。投稿者が育てるデータ。",
  },
  {
    emoji: "🎯",
    title: "次に何を積むべきかが分かる",
    body: "勝てる人材になるための、最短距離が見えてくる。",
  },
];

const STEPS = [
  {
    num: "01",
    title: "自分の軌跡を残す",
    body: (
      <>
        これまでの職歴・国・業界を入力。
        <br />
        同じ経路を歩いた人が、自動で見つかります。
      </>
    ),
  },
  {
    num: "02",
    title: "先に行った人を探す",
    body: (
      <>
        &quot;A→Bを歩いた人&quot;
        を、移動経路・業界・職種から検索。
        <br />
        LinkedInではできない、キャリアフロー検索。
      </>
    ),
  },
  {
    num: "03",
    title: "話を聞き、答え合わせをする",
    body: (
      <>
        無料 or 有料で、その人に相談できる。
        <br />
        次に何を積むべきか、リアルな声で。
      </>
    ),
  },
];

const TESTIMONIALS = [
  {
    initials: "YT",
    bg: "bg-blue",
    text: "text-cream",
    quote: (
      <>
        &quot;Sony時代の自分には、SGでPMやってる人なんて
        <br />
        想像もできなかった。
        <span className="font-bold">先に行った3人</span>
        に話を聞いて、
        <br />
        やっと現実的に思えた。&quot;
      </>
    ),
    meta: "YTさん · Tokyo → Singapore · 34歳 PM",
  },
  {
    initials: "RN",
    bg: "bg-jade",
    text: "text-ink",
    quote: (
      <>
        &quot;失敗事例を聞けたのが大きい。
        <br />
        家族の同行で何が起きるか、
        <br />
        <span className="font-bold">事前に想像できた</span>
        のは本当にありがたい。&quot;
      </>
    ),
    meta: "RNさん · Osaka → Hong Kong · 29歳 Marketing",
  },
  {
    initials: "MS",
    bg: "bg-mustard",
    text: "text-ink",
    quote: (
      <>
        &quot;次に何を積めばいいか、
        <br />
        <span className="font-bold">道筋がはっきり見えた</span>。
        <br />
        海外で勝つために必要なものが分かった。&quot;
      </>
    ),
    meta: "MSさん · Tokyo → Bangkok · 31歳 Engineer",
  },
];

const FAQS = [
  {
    q: "海外経験ゼロでも使えますか?",
    a: "むしろ、これからの方こそ最も価値があります。先に行った人を探し、話を聞くことで、自分が今何を準備すべきかが具体的に分かります。",
  },
  {
    q: "料金はかかりますか?",
    a: "登録・基本機能はすべて無料。先輩への相談は、相手が設定する料金（無料 / コーヒー1杯 / 30分セッション）に応じてお支払いいただきます。",
  },
  {
    q: "日本人以外も使えますか?",
    a: "はい。日本から海外へ動く人だけでなく、日本で働きたい人にも開かれています。日本語と英語の両方で利用可能です。",
  },
  {
    q: "経歴は実名で公開する必要がありますか?",
    a: "いいえ、匿名と実名を選べます。会社名や経歴は会員のみ閲覧可、給与情報は完全匿名など、公開範囲を細かく設定できます。",
  },
  {
    q: "転職活動に使えますか?",
    a: "X Border Hubは人材紹介サービスではありません。あくまで、先に行った人と繋がり、知見を得るための場所です。結果として転職に繋がることはありますが、紹介手数料などは発生しません。",
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main className="relative z-10">
        {/* HERO */}
        <section className="relative pt-10 pb-12 px-5 overflow-hidden">
          <div className="hero-bg">
            <div
              className="hero-blob bg-blue"
              style={{
                top: "5%",
                right: "-20%",
                width: 240,
                height: 240,
              }}
            />
            <div
              className="hero-blob bg-jade"
              style={{
                bottom: "10%",
                left: "-25%",
                width: 200,
                height: 200,
              }}
            />
            <div
              className="hero-blob bg-mustard"
              style={{
                top: "40%",
                right: "30%",
                width: 100,
                height: 100,
              }}
            />
          </div>

          <div className="container-app relative">
            <div className="rise inline-flex items-center gap-2 bg-cream border-[1.5px] border-ink rounded-full px-3 py-1.5 shadow-pop-sm mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue pulse-soft" />
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-ink">
                FOR THOSE READY TO MOVE
              </span>
            </div>

            <h1
              className="rise display font-bold leading-[1.15] tracking-tight text-ink"
              style={{
                animationDelay: "0.05s",
                fontSize: "clamp(22px, 5.5vw, 44px)",
              }}
            >
              <span className="whitespace-nowrap">海外で働く前に、</span>
              <wbr />
              <span
                className="whitespace-nowrap serif-it u-blue"
                style={{ fontSize: "1.1em" }}
              >
                &quot;答え合わせ&quot;
              </span>
              <wbr />
              <span className="whitespace-nowrap">できる場所を。</span>
            </h1>

            <p
              className="rise mt-5 text-[15px] leading-[1.7] text-ink-soft"
              style={{ animationDelay: "0.12s" }}
            >
              先に行った人が、道を残す。
              <br />
              次に
              <span className="font-bold text-ink">
                何を積めば、海外で勝てる人材になれるのか
              </span>
              ——
              <br />
              その答えを、リアルに歩いた人から見つける。
            </p>

            <div
              className="rise mt-7 flex flex-col gap-3"
              style={{ animationDelay: "0.18s" }}
            >
              <Link href="/login" className="btn-primary">
                無料で始める
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#how" className="btn-secondary">
                仕組みを見る
              </Link>
            </div>

            <div
              className="rise mt-8 flex items-center gap-3"
              style={{ animationDelay: "0.24s" }}
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue border-[1.5px] border-ink text-cream font-bold text-[10px] flex items-center justify-center">
                  YT
                </div>
                <div className="w-8 h-8 rounded-full bg-jade border-[1.5px] border-ink text-ink font-bold text-[10px] flex items-center justify-center">
                  AK
                </div>
                <div className="w-8 h-8 rounded-full bg-mustard border-[1.5px] border-ink text-ink font-bold text-[10px] flex items-center justify-center">
                  MS
                </div>
                <div className="w-8 h-8 rounded-full bg-plum border-[1.5px] border-ink text-cream font-bold text-[10px] flex items-center justify-center">
                  RN
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-soft border-[1.5px] border-ink text-ink font-bold text-[10px] flex items-center justify-center">
                  HK
                </div>
              </div>
              <p className="text-[12px] text-ink-soft font-semibold">
                <span className="text-ink font-bold">3,847人</span>
                のキャリアが、ここに集まっています
              </p>
            </div>
          </div>
        </section>

        {/* VISION QUOTE */}
        <section className="px-5 py-12 bg-ink text-cream relative overflow-hidden">
          <div className="absolute -top-10 -left-8 w-32 h-32 rounded-full bg-blue opacity-30" />
          <div className="absolute -bottom-12 -right-6 w-40 h-40 rounded-full bg-mustard opacity-15" />

          <div className="container-app relative">
            <div className="text-[10px] uppercase tracking-[0.28em] text-mustard font-bold mb-4">
              OUR VISION
            </div>
            <p className="serif-it text-[28px] leading-[1.35] text-cream">
              あらゆる人が、
              <br />
              母国に閉じないキャリアを
              <br />
              歩める世界へ。
            </p>
            <p className="mt-5 text-[14px] leading-[1.75] text-cream/85">
              日本人が、もっと
              <span className="text-mustard font-bold">自然に</span>・
              <br />
              もっと
              <span className="text-mustard font-bold">戦略的に</span>
              、海外に出ていける。
              <br />
              その
              <span className="text-mustard font-bold">最初の一歩</span>
              を、支えたい。
            </p>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="px-5 py-14">
          <div className="container-app">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink-soft font-bold">
                THE PROBLEM
              </span>
            </div>
            <h2 className="display font-bold text-[28px] leading-[1.15] text-ink">
              海外に出たい人が、
              <br />
              本当に抱えている
              <span className="serif-it text-[32px] u-blue">不安</span>。
            </h2>
            <p className="mt-3 text-[13px] text-ink-soft leading-relaxed">
              スキルや英語より先に、これが心を止める。
            </p>

            <div className="mt-7 space-y-3">
              {FEARS.map((fear, i) => (
                <div
                  key={i}
                  className="fear-card bg-paper border-[1.5px] border-ink rounded-2xl p-4 shadow-pop"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{fear.emoji}</span>
                    <div>
                      <p className="display font-bold text-[16px] text-ink leading-tight">
                        {fear.title}
                      </p>
                      <p className="text-[12px] text-ink-soft mt-1.5">
                        {fear.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE ANSWER */}
        <section className="px-5 py-14 bg-paper border-y-[1.5px] border-ink relative overflow-hidden">
          <div className="absolute top-10 right-5 w-24 h-24 rounded-full bg-blue opacity-10" />
          <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-jade opacity-15" />

          <div className="container-app relative">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-blue font-bold">
                THE ANSWER
              </span>
            </div>
            <h2 className="display font-bold text-[28px] leading-[1.15] text-ink">
              先に行った人が、
              <br />
              <span className="serif-it text-[32px] u-blue">道を残す。</span>
            </h2>
            <p className="mt-4 text-[14px] text-ink-soft leading-[1.8]">
              X Border Hubは、海外で働く・働いた人たちが
              <br />
              自分のキャリアの軌跡を残し、
              <br />
              次に続く人と繋がる場所です。
            </p>

            <div className="mt-7 grid grid-cols-1 gap-3">
              {ANSWERS.map((a, i) => (
                <div
                  key={i}
                  className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 flex items-start gap-3 shadow-pop-sm"
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="display font-bold text-[15px] text-ink">
                      {a.title}
                    </p>
                    <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">
                      {a.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="px-5 py-14">
          <div className="container-app">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink-soft font-bold">
                HOW IT WORKS
              </span>
            </div>
            <h2 className="display font-bold text-[28px] leading-[1.15] text-ink">
              3ステップで、
              <br />
              <span className="serif-it text-[32px] u-mustard">次の一歩</span>
              が見える。
            </h2>

            <div className="mt-7 space-y-5">
              {STEPS.map((step) => (
                <div key={step.num} className="relative">
                  <div className="flex gap-3 items-start">
                    <div className="step-num">{step.num}</div>
                    <div className="flex-1 bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm">
                      <p className="display font-bold text-[16px] text-ink">
                        {step.title}
                      </p>
                      <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE PREVIEW */}
        <section className="px-5 py-14 bg-ink text-cream relative overflow-hidden">
          <div className="absolute -top-10 -right-12 w-48 h-48 rounded-full bg-blue opacity-25" />
          <div className="absolute bottom-10 -left-10 w-32 h-32 rounded-full bg-jade opacity-20" />

          <div className="container-app relative">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-mustard font-bold">
                LIVE PREVIEW
              </span>
            </div>
            <h2 className="display font-bold text-[26px] leading-[1.15] text-cream">
              今、世界で起きている
              <br />
              <span className="serif-it text-[30px]" style={{ color: "#FFC93C" }}>
                動き
              </span>
              を、覗いてみる。
            </h2>

            <div className="mt-6 bg-paper text-ink border-[1.5px] border-ink rounded-3xl p-4 shadow-pop">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] mb-2">
                <span className="flex items-center gap-1.5 text-blue font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue pulse-soft" />
                  LIVE
                </span>
                <span className="display font-semibold text-ink-soft">
                  ASIA-PAC
                </span>
                <span className="text-ink-soft font-bold">今週 234 moves</span>
              </div>

              <svg viewBox="0 0 340 250" className="w-full h-auto">
                <defs>
                  <marker
                    id="lp-b"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0055A4" />
                  </marker>
                  <marker
                    id="lp-j"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#1FA89E" />
                  </marker>
                  <marker
                    id="lp-m"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B4F8E" />
                  </marker>
                </defs>
                <g opacity="0.07">
                  <circle cx="258" cy="55" r="28" fill="#0A1F3D" />
                  <circle cx="128" cy="195" r="28" fill="#0A1F3D" />
                  <circle cx="88" cy="138" r="28" fill="#0A1F3D" />
                </g>
                <path
                  d="M 258 55 Q 175 140 128 195"
                  fill="none"
                  stroke="#0055A4"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  className="arc-flow"
                  markerEnd="url(#lp-b)"
                />
                <path
                  d="M 128 195 Q 95 165 88 138"
                  fill="none"
                  stroke="#1FA89E"
                  strokeWidth="3.0"
                  strokeLinecap="round"
                  className="arc-flow"
                  markerEnd="url(#lp-j)"
                />
                <path
                  d="M 128 195 Q 215 130 258 55"
                  fill="none"
                  stroke="#6B4F8E"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  className="arc-flow"
                  markerEnd="url(#lp-m)"
                />

                <g>
                  <circle
                    cx="258"
                    cy="55"
                    r="18"
                    fill="none"
                    stroke="#0A1F3D"
                    strokeWidth="0.7"
                    opacity="0.3"
                  />
                  <circle
                    cx="258"
                    cy="55"
                    r="12"
                    fill="none"
                    stroke="#0A1F3D"
                    strokeWidth="1.4"
                  />
                  <circle cx="258" cy="55" r="7" fill="#0A1F3D" />
                  <circle cx="258" cy="55" r="4" fill="#FFF6E8" />
                  <text
                    x="245"
                    y="50"
                    fontFamily="Bricolage Grotesque"
                    fontSize="13"
                    fontWeight="800"
                    fill="#0A1F3D"
                    textAnchor="end"
                  >
                    TYO
                  </text>
                  <text
                    x="245"
                    y="61"
                    fontFamily="Manrope"
                    fontSize="8.5"
                    fontWeight="600"
                    fill="#3A4658"
                    textAnchor="end"
                  >
                    東京
                  </text>
                </g>
                <g>
                  <circle
                    cx="128"
                    cy="195"
                    r="18"
                    fill="none"
                    stroke="#0055A4"
                    strokeWidth="0.7"
                    opacity="0.3"
                  />
                  <circle
                    cx="128"
                    cy="195"
                    r="12"
                    fill="none"
                    stroke="#0055A4"
                    strokeWidth="1.4"
                  />
                  <circle cx="128" cy="195" r="7" fill="#0055A4" />
                  <circle cx="128" cy="195" r="4" fill="#FFF6E8" />
                  <text
                    x="142"
                    y="200"
                    fontFamily="Bricolage Grotesque"
                    fontSize="13"
                    fontWeight="800"
                    fill="#0055A4"
                  >
                    SIN
                  </text>
                  <text
                    x="142"
                    y="212"
                    fontFamily="Manrope"
                    fontSize="8.5"
                    fontWeight="600"
                    fill="#3A4658"
                  >
                    Singapore
                  </text>
                </g>
                <g>
                  <circle cx="88" cy="138" r="6" fill="#1FA89E" />
                  <circle cx="88" cy="138" r="3" fill="#FFF6E8" />
                  <text
                    x="100"
                    y="142"
                    fontFamily="Bricolage Grotesque"
                    fontSize="11"
                    fontWeight="800"
                    fill="#1FA89E"
                  >
                    BKK
                  </text>
                </g>
                <g>
                  <circle cx="185" cy="115" r="4" fill="#0A1F3D" />
                  <text
                    x="195"
                    y="118"
                    fontFamily="Bricolage Grotesque"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0A1F3D"
                  >
                    HKG
                  </text>
                </g>
              </svg>

              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-3 border-t border-dashed border-ink/20">
                <div>
                  <div className="display font-bold text-[20px] leading-none text-blue">
                    +12
                  </div>
                  <div className="text-[9px] text-ink-faint uppercase tracking-wider mt-1 font-bold">
                    TYO→SIN
                  </div>
                </div>
                <div>
                  <div
                    className="display font-bold text-[20px] leading-none"
                    style={{ color: "#1FA89E" }}
                  >
                    +8
                  </div>
                  <div className="text-[9px] text-ink-faint uppercase tracking-wider mt-1 font-bold">
                    SIN→BKK
                  </div>
                </div>
                <div>
                  <div
                    className="display font-bold text-[20px] leading-none"
                    style={{ color: "#6B4F8E" }}
                  >
                    +5
                  </div>
                  <div className="text-[9px] text-ink-faint uppercase tracking-wider mt-1 font-bold">
                    SIN→TYO
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/home"
              className="mt-5 block w-full text-center py-3.5 bg-mustard text-ink rounded-2xl text-[13px] font-bold border-[1.5px] border-cream/0"
            >
              実際のサイトを見てみる →
            </Link>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="px-5 py-14">
          <div className="container-app">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink-soft font-bold">
                VOICES
              </span>
            </div>
            <h2 className="display font-bold text-[26px] leading-[1.15] text-ink">
              実際に、
              <span className="serif-it text-[30px] u-blue">一歩</span>を
              <br />
              踏み出した人たち。
            </h2>

            <div className="mt-7 space-y-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${t.bg} ${t.text} font-bold text-[12px] flex items-center justify-center border-[1.5px] border-ink flex-shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div className="flex-1">
                    <div className="quote-bubble">
                      <p className="text-[13px] leading-[1.7] text-ink">
                        {t.quote}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink-faint font-bold mt-2 ml-1">
                      {t.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-14 bg-paper border-y-[1.5px] border-ink">
          <div className="container-app">
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink-soft font-bold">
                FAQ
              </span>
            </div>
            <h2 className="display font-bold text-[26px] leading-[1.15] text-ink">
              よくある質問
            </h2>

            <div className="mt-7 space-y-3">
              {FAQS.map((faq, i) => (
                <details
                  key={i}
                  className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm"
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
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-5 py-14">
          <div className="container-app">
            <div className="bg-ink text-cream rounded-3xl p-7 relative overflow-hidden shadow-pop-blue">
              <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-blue opacity-30" />
              <div className="absolute -bottom-12 -left-6 w-28 h-28 rounded-full bg-mustard opacity-20" />

              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.28em] text-mustard font-bold mb-3">
                  YOUR TURN
                </div>
                <p className="display font-bold text-[28px] leading-[1.1] text-cream">
                  あなたの
                  <span
                    className="serif-it text-[32px]"
                    style={{ color: "#FFC93C" }}
                  >
                    一歩
                  </span>
                  を、
                  <br />
                  ここから始める。
                </p>
                <p className="mt-4 text-[13px] leading-relaxed text-cream/85">
                  メール登録だけで、3分後には
                  <br />
                  同じ経路を歩いた人と繋がれます。
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link
                    href="/login"
                    className="block w-full text-center py-3.5 bg-mustard text-ink rounded-full text-[14px] font-bold"
                  >
                    無料で始める →
                  </Link>
                  <Link
                    href="/home"
                    className="block w-full text-center py-3 text-cream/80 text-[12px] font-bold underline-offset-4 underline"
                  >
                    まずは中を見てみる
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>
    </>
  );
}
