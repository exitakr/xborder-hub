import Link from "next/link";
import { brand, wordmark } from "@oma/core";
import type { Locale } from "@oma/core";
import { getDict } from "@oma/core";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  locale: Locale;
  signedIn: boolean;
  isAdmin: boolean;
}

/**
 * One header for the whole app. Signed-out visitors get a marketing header;
 * signed-in users get the three destinations that matter and nothing else —
 * keeping navigation to three items is what keeps the app legible on a phone.
 */
export function SiteHeader({ locale, signedIn, isAdmin }: Props) {
  const t = getDict(locale);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-app items-center gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Always the full name. The abbreviation was here to keep the
            Japanese navigation on one row, but shortening the nav labels
            themselves solved that — and a wordmark that changes with viewport
            width reads as two different products. */}
        <Link
          href={signedIn ? "/portfolio" : "/"}
          className="shrink-0 rounded text-sm font-semibold tracking-tight sm:text-base"
        >
          {wordmark(locale)}
          <span className="sr-only"> — {brand.tagline[locale]}</span>
        </Link>

        {signedIn ? (
          /*
           * `overflow-x-auto` + `whitespace-nowrap` rather than `flex-wrap`: a
           * wrapped second row of links reads as indented body text sitting
           * under the logo, since nothing on this row lines up with it. A
           * horizontal scroll keeps every link on the one row it belongs to,
           * at the cost of a scroll gesture on the narrowest phones.
           */
          <nav
            aria-label={t.navPortfolio}
            className="scrollbar-none ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto whitespace-nowrap sm:gap-1"
          >
            <NavLink href="/portfolio">{t.navPortfolio}</NavLink>
            <NavLink href="/market">{t.navMarket}</NavLink>
            <NavLink href="/mypage">{t.navMypage}</NavLink>
            {isAdmin && <NavLink href="/admin">{t.navAdmin}</NavLink>}
            <ThemeToggle label={t.themeToggle} />
            <LogoutButton label={t.navLogout} />
          </nav>
        ) : (
          <nav className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle label={t.themeToggle} />
            <Link href="/login" className="btn-secondary px-3 py-1.5 text-sm sm:px-4 sm:py-2">
              {t.navLogin}
            </Link>
            <Link href="/signup" className="btn-primary px-3 py-1.5 text-sm sm:px-4 sm:py-2">
              {t.navSignup}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-lg px-2 py-2 text-xs text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3 sm:text-sm"
    >
      {children}
    </Link>
  );
}
