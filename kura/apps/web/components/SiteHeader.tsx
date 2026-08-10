import Link from "next/link";
import { brand, wordmark } from "@oma/core";
import type { Locale } from "@oma/core";
import { getDict } from "@oma/core";
import { LocaleToggle } from "./LocaleToggle";
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
            {/* Logout lives in /mypage, not here. It is a rare, irreversible-
                feeling action sitting one mis-tap from the links people use
                constantly, and on a phone this row already scrolls — a button
                that ends the session should not be something you can hit while
                swiping past it. */}
            <ThemeToggle label={t.themeToggle} />
          </nav>
        ) : (
          <nav className="ml-auto flex shrink-0 items-center gap-2">
            {/* Signed-in users switch language in /mypage, where it is saved to
                the account. A visitor has nowhere to save it yet, and choosing
                whether to sign up is when reading the page matters most. */}
            <LocaleToggle locale={locale} />
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
