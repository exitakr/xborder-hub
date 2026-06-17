import Link from "next/link";

/**
 * Tiny in-app footer with legal links. Rendered on authenticated pages
 * that don't already include the marketing `LandingFooter`. Kept small
 * and discreet so it doesn't compete with primary content, but visible
 * enough that users can always reach Terms / Privacy / Contact from any
 * page (required for 個人情報保護法 compliance).
 */
export function AppFooter() {
  return (
    <footer className="px-5 pt-6 pb-24 lg:pb-10 text-center">
      <div className="container-app">
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
