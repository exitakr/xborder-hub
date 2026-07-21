import Link from "next/link";

/**
 * Tiny in-app footer with legal links. Rendered on authenticated pages
 * that don't already include the marketing `LandingFooter`. Kept small
 * and discreet so it doesn't compete with primary content, but visible
 * enough that users can always reach Terms / Privacy / Contact from any
 * page (required for 個人情報保護法 compliance).
 */
const SALARY_LINKS: { slug: string; label: string }[] = [
  { slug: "singapore", label: "シンガポール年収" },
  { slug: "usa", label: "アメリカ年収" },
  { slug: "uk", label: "イギリス年収" },
  { slug: "australia", label: "オーストラリア年収" },
  { slug: "germany", label: "ドイツ年収" },
  { slug: "thailand", label: "タイ年収" },
];

export function AppFooter() {
  return (
    <footer className="px-5 pt-6 pb-24 lg:pb-10 text-center">
      <div className="container-app">
        {/* Crawl path into the programmatic SEO cluster from public pages */}
        <p className="text-[10px] text-ink-faint font-semibold flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2">
          {SALARY_LINKS.map((l, i) => (
            <span key={l.slug} className="inline-flex items-center gap-x-3">
              {i > 0 && <span className="text-ink-faint/40">·</span>}
              <Link
                href={`/salaries/${l.slug}`}
                className="hover:text-ink underline-offset-2 hover:underline"
              >
                {l.label}
              </Link>
            </span>
          ))}
          <span className="text-ink-faint/40">·</span>
          <Link
            href="/check"
            className="hover:text-ink underline-offset-2 hover:underline"
          >
            海外転職 準備度チェック
          </Link>
        </p>
        <p className="text-[10px] text-ink-faint font-semibold flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/legal/terms" className="hover:text-ink underline-offset-2 hover:underline">
            利用規約
          </Link>
          <span className="text-ink-faint/40">·</span>
          <Link href="/legal/privacy" className="hover:text-ink underline-offset-2 hover:underline">
            プライバシー
          </Link>
          <span className="text-ink-faint/40">·</span>
          <Link href="/legal/contact" className="hover:text-ink underline-offset-2 hover:underline">
            お問い合わせ
          </Link>
        </p>
        <p className="text-[9px] text-ink-faint mt-2">© 2026 X Border Hub</p>
      </div>
    </footer>
  );
}
