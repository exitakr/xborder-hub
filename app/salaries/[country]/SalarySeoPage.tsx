import Link from "next/link";
import {
  JPY_SALARY_OPTS,
  RENT_OPTS,
  VISA_OPTS,
} from "@/lib/profile/options";
import type { SalaryPageStats } from "@/lib/seo/salaryStats";
import {
  SEO_COUNTRIES,
  SEO_ROLES,
  type SeoCountry,
  type SeoRole,
} from "@/lib/seo/salaryPages";

/**
 * Server-rendered body shared by /salaries/[country] and
 * /salaries/[country]/[role]. Public (crawler-friendly): shows n>=5
 * aggregates or a データ募集中 CTA, plus internal links that knit the
 * 315-page cluster together. Individual entries stay behind the
 * Give-to-Get gate on /salaries — this page never shows row-level data.
 */

function labelFor(opts: { v: string; label: string }[], v: string): string {
  return opts.find((o) => o.v === v)?.label ?? v;
}

function DistTable({
  title,
  rows,
  opts,
  total,
}: {
  title: string;
  rows: { key: string; count: number }[];
  opts: { v: string; label: string }[];
  total: number;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="bg-paper border border-ink/10 rounded-2xl p-4">
      <h3 className="display font-bold text-[14px] text-ink mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-ink w-[120px] flex-none">
              {labelFor(opts, r.key)}
            </span>
            <div className="flex-1 h-3 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue rounded-full"
                style={{ width: `${Math.round((r.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-soft w-10 text-right flex-none">
              {Math.round((r.count / Math.max(total, 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalarySeoPage({
  country,
  role,
  stats,
}: {
  country: SeoCountry;
  role: SeoRole | null;
  stats: SalaryPageStats;
}) {
  const subject = role ? `${country.ja}の${role.ja}` : `${country.ja}で働く日本人`;
  const hasData = stats.n >= 5;

  const faq = [
    {
      q: `${country.ja}${role ? `の${role.ja}` : "で働く日本人"}の年収はいくらですか?`,
      a: hasData && stats.salary[0]
        ? `X Border Hub の実データ(n=${stats.n})では、最も多い年収帯は「${labelFor(JPY_SALARY_OPTS, stats.salary[0].key)}」です。会員登録して自分のデータを1件投稿すると、全データの内訳を閲覧できます。`
        : `現在データを募集中です(現在 ${stats.n} 件)。X Border Hub では実際に${country.ja}で働く日本人の匿名年収データを収集しており、5件以上集まり次第この場で公開されます。`,
    },
    {
      q: `${country.ja}の家賃相場はどのくらいですか?`,
      a: hasData && stats.rent[0]
        ? `実データでは「${labelFor(RENT_OPTS, stats.rent[0].key)}」の回答が最多です。`
        : `データ収集中です。移住経験者のリアルな家賃データが集まり次第公開します。`,
    },
    {
      q: `${country.ja}で働くにはどんなビザが必要ですか?`,
      a: hasData && stats.visa[0]
        ? `回答者に最も多いビザ種別は「${labelFor(VISA_OPTS, stats.visa[0].key)}」です。経験者に直接 Coffee Chat で相談することもできます。`
        : `X Border Hub では${country.ja}で働く日本人メンバーにビザ取得の実体験を直接相談できます。`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "Dataset",
        name: `${subject}の年収・生活コストデータ`,
        description: `${country.ja}${role ? `の${role.ja}` : ""}で働く日本人の匿名年収・家賃・ビザ・満足度データ(X Border Hub 会員投稿)`,
        creator: { "@type": "Organization", name: "X Border Hub" },
        isAccessibleForFree: false,
        variableMeasured: ["年収レンジ", "家賃レンジ", "ビザ種別", "WLB満足度"],
      },
    ],
  };

  const otherRoles = role
    ? SEO_ROLES.filter((r) => r.slug !== role.slug).slice(0, 8)
    : SEO_ROLES.slice(0, 10);
  const otherCountries = SEO_COUNTRIES.filter(
    (c) => c.slug !== country.slug,
  ).slice(0, 8);

  return (
    <main className="container-app py-6 lg:py-8 relative z-10 pb-24 lg:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-ink-faint font-bold flex items-center gap-1.5 flex-wrap">
          <Link href="/salaries" className="hover:text-ink">年収データ</Link>
          <span>›</span>
          {role ? (
            <>
              <Link href={`/salaries/${country.slug}`} className="hover:text-ink">
                {country.flag} {country.ja}
              </Link>
              <span>›</span>
              <span className="text-ink">{role.ja}</span>
            </>
          ) : (
            <span className="text-ink">{country.flag} {country.ja}</span>
          )}
        </nav>

        <header>
          <h1 className="display font-bold text-[24px] sm:text-[30px] leading-tight tracking-tight text-ink">
            {country.flag} {subject}の年収・生活コスト【2026年実データ】
          </h1>
          <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">
            実際に{country.ja}で働く日本人が匿名で投稿した年収・家賃・ビザ・
            ワークライフバランスのデータです。転職・駐在・移住の検討にお役立てください。
          </p>
        </header>

        {hasData ? (
          <>
            {/* Stats header */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-ink text-cream font-bold text-[12px] px-3 py-1.5 rounded-full">
                実データ {stats.n} 件
              </span>
              {stats.wlbAvg !== null && (
                <span className="bg-paper border border-ink/10 text-ink font-bold text-[12px] px-3 py-1.5 rounded-full">
                  WLB満足度 {stats.wlbAvg} / 5
                </span>
              )}
              {stats.lifeAvg !== null && (
                <span className="bg-paper border border-ink/10 text-ink font-bold text-[12px] px-3 py-1.5 rounded-full">
                  生活満足度 {stats.lifeAvg} / 10
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DistTable title="💰 年収レンジ分布" rows={stats.salary} opts={JPY_SALARY_OPTS} total={stats.n} />
              <DistTable title="🏠 家賃レンジ分布" rows={stats.rent} opts={RENT_OPTS} total={stats.n} />
              <DistTable title="🛂 ビザ種別" rows={stats.visa} opts={VISA_OPTS} total={stats.n} />
            </div>

            <div className="bg-blue-soft/20 border border-blue/20 rounded-2xl p-5">
              <p className="display font-bold text-[15px] text-ink mb-1">
                個別の詳細データ({stats.n}件)を全て見る
              </p>
              <p className="text-[12px] text-ink-soft mb-3">
                自分の年収データを1件投稿すると、{country.ja}を含む全メンバーの
                詳細データ(ボーナス・貯蓄率・労働時間・リモート頻度など)が閲覧できます。
              </p>
              <Link href="/salaries" className="inline-block bg-ink text-cream font-bold text-[13px] px-5 py-2.5 rounded-full">
                投稿して全データを見る →
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-paper border border-ink/10 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">📊</p>
            <p className="display font-bold text-[17px] text-ink">
              {subject}のデータ募集中(現在 {stats.n} 件)
            </p>
            <p className="text-[12px] text-ink-soft mt-2 mb-4 leading-relaxed max-w-md mx-auto">
              5件以上集まり次第、年収・家賃・ビザの実データ集計をこのページで公開します。
              {country.ja}で働いた経験があれば、あなたの1件が最初の道しるべになります。
            </p>
            <Link href="/salaries" className="inline-block bg-ink text-cream font-bold text-[13px] px-5 py-2.5 rounded-full">
              匿名で年収データを投稿する →
            </Link>
          </div>
        )}

        {/* keyword-bearing section */}
        <section className="space-y-3">
          <h2 className="display font-bold text-[18px] text-ink">
            {country.ja}への転職・駐在を考えている日本人へ
          </h2>
          <p className="text-[13px] text-ink-soft leading-relaxed">
            {country.ja}の駐在給料や現地採用の給与水準は、業界・職種・ビザ種別で大きく変わります。
            X Border Hub には{country.ja}で実際に働く日本人メンバーが在籍しており、
            気になる相手に Coffee Chat(1対1のオンライン相談)を申請して、
            転職活動・ビザ取得・生活立ち上げのリアルを直接聞くことができます。
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/search" className="text-[12px] font-bold text-blue underline underline-offset-2">
              {country.ja}のメンバーを探す →
            </Link>
            <Link href="/threads" className="text-[12px] font-bold text-blue underline underline-offset-2">
              {country.ja}のスレッドを読む →
            </Link>
          </div>
        </section>

        {/* FAQ (visible mirror of JSON-LD) */}
        <section className="space-y-2">
          <h2 className="display font-bold text-[18px] text-ink">よくある質問</h2>
          {faq.map((f) => (
            <details key={f.q} className="bg-paper border border-ink/10 rounded-xl px-4 py-3">
              <summary className="text-[13px] font-bold text-ink cursor-pointer">{f.q}</summary>
              <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </section>

        {/* Internal links */}
        <section className="space-y-3 pt-2 border-t border-ink/10">
          <h2 className="display font-bold text-[14px] text-ink">
            {country.ja}の他の職種
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {otherRoles.map((r) => (
              <Link
                key={r.slug}
                href={`/salaries/${country.slug}/${r.slug}`}
                className="text-[11px] font-bold text-ink bg-cream border border-ink/10 rounded-full px-3 py-1 hover:border-ink"
              >
                {r.ja}
              </Link>
            ))}
          </div>
          {role && (
            <>
              <h2 className="display font-bold text-[14px] text-ink pt-1">
                他の国の{role.ja}
              </h2>
              <div className="flex gap-1.5 flex-wrap">
                {otherCountries.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/salaries/${c.slug}/${role.slug}`}
                    className="text-[11px] font-bold text-ink bg-cream border border-ink/10 rounded-full px-3 py-1 hover:border-ink"
                  >
                    {c.flag} {c.ja}
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
