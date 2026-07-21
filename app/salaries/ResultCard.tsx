"use client";

import { ShareButtons } from "@/components/site/ShareButtons";
import type { CompShareStats } from "@/lib/compensation/actions";
import { findCountryByDb, findRoleByDb } from "@/lib/seo/salaryPages";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xbordercareer.com";

/**
 * Post-contribution celebration + share card. Shows a coarse "top X%" when
 * the country×role pool has n>=5 (via getCompShareStats / migration 0016),
 * otherwise a "you're an early contributor" framing that still reads well.
 * The share link points at the matching public SEO page so clicks convert
 * into new contributions (share → traffic → post loop).
 */
export function ResultCard({
  country,
  role,
  stats,
  onDone,
}: {
  country: string; // compensation_data value
  role: string; // compensation_data value
  stats: CompShareStats;
  onDone: () => void;
}) {
  const c = findCountryByDb(country);
  const r = findRoleByDb(role);
  const flag = c?.flag ?? "🌏";
  const countryJa = c?.ja ?? country;
  const roleJa = r?.ja ?? role;

  const hasPct = stats.topPct != null;

  // Landing page for the share link: role page if both are in the SEO
  // catalog, else the country hub, else the salaries index.
  const landing =
    c && r
      ? `${BASE}/salaries/${c.slug}/${r.slug}`
      : c
        ? `${BASE}/salaries/${c.slug}`
        : `${BASE}/salaries`;

  const ogParams = new URLSearchParams({ country, role });
  if (hasPct) ogParams.set("top", String(stats.topPct));
  const ogPreview = `/og/result?${ogParams.toString()}`;

  const shareText = hasPct
    ? `私の年収は ${countryJa} × ${roleJa} で上位${stats.topPct}%相当でした（X Border Hub の実データ${stats.sampleN}件）。あなたの位置も匿名でわかります👇`
    : `${countryJa}で働く${roleJa}の年収データに貢献しました。海外キャリアのリアルな年収・家賃・ビザを匿名で見られる X Border Hub 👇`;

  return (
    <div className="bg-paper border border-ink rounded-3xl p-5 lg:p-7 shadow-pop text-center">
      <p className="text-3xl mb-1">🎉</p>
      <h2 className="display font-bold text-[20px] text-ink leading-tight">
        投稿ありがとうございます!
      </h2>
      <p className="text-[12px] text-ink-soft mt-1.5">
        全メンバーの詳細データが閲覧できるようになりました。
      </p>

      {/* Result headline */}
      <div className="my-5">
        {hasPct ? (
          <div className="bg-ink text-cream rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cream/70 font-bold">
              {flag} {countryJa} × {roleJa}
            </p>
            <p className="display font-bold text-[44px] leading-none text-mustard mt-2">
              上位 {stats.topPct}%
            </p>
            <p className="text-[11px] text-cream/70 mt-2">
              {stats.scope === "country"
                ? `${countryJa}の実データ ${stats.sampleN} 件中(職種横断)`
                : `${countryJa} × ${roleJa} の実データ ${stats.sampleN} 件中`}
              の総額レンジ相当
            </p>
          </div>
        ) : (
          <div className="bg-cream border border-ink/15 rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft font-bold">
              {flag} {countryJa} × {roleJa}
            </p>
            <p className="display font-bold text-[22px] leading-tight text-ink mt-2">
              あなたは最初期の貢献者です
            </p>
            <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
              この組み合わせはまだデータが少なく(現在 {stats.sampleN} 件)、
              5件集まると上位%が表示されます。シェアで仲間を呼ぶと早く集まります。
            </p>
          </div>
        )}
      </div>

      <div className="mb-4 flex justify-center">
        <ShareButtons url={landing} text={shareText} source="salary_result" />
      </div>

      <p className="text-[10px] text-ink-faint mb-4 leading-relaxed">
        シェアされるのは匿名のレンジ情報のみです(個人の金額・プロフィールは含まれません)。
        <br />
        <a href={ogPreview} target="_blank" rel="noopener noreferrer" className="underline">
          シェア画像をプレビュー
        </a>
      </p>

      <button
        type="button"
        onClick={onDone}
        className="text-[12px] font-bold text-blue underline underline-offset-2"
      >
        データを見る →
      </button>
    </div>
  );
}
