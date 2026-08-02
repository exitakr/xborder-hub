import Link from "next/link";
import { brand, wordmark } from "@kura/core";
import type { Locale } from "@kura/core";
import { getDict } from "@kura/core";
import { LogoutButton } from "./LogoutButton";

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
      <div className="mx-auto flex h-14 max-w-app items-center gap-4 px-4">
        <Link
          href={signedIn ? "/portfolio" : "/"}
          className="rounded text-base font-semibold tracking-tight"
        >
          {wordmark(locale)}
          <span className="sr-only"> — {brand.tagline[locale]}</span>
        </Link>

        {signedIn ? (
          <nav aria-label={t.navPortfolio} className="ml-auto flex items-center gap-1">
            <NavLink href="/portfolio">{t.navPortfolio}</NavLink>
            <NavLink href="/market">{t.navMarket}</NavLink>
            <NavLink href="/mypage">{t.navMypage}</NavLink>
            {isAdmin && <NavLink href="/admin/prices">{t.navAdmin}</NavLink>}
            <LogoutButton label={t.navLogout} />
          </nav>
        ) : (
          <nav className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn-secondary">
              {t.navLogin}
            </Link>
            <Link href="/signup" className="btn-primary">
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
      className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
    >
      {children}
    </Link>
  );
}
