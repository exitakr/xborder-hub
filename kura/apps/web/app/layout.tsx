import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { brand, wordmark } from "@oma/core";
import { site } from "@/lib/site";
import { getDict, isLocale } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Disclaimer } from "@/components/Disclaimer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.tagline.en,
  robots: { index: true, follow: true },
  applicationName: brand.name,
  // Both launch markets, declared: a Japanese searcher and a Singaporean one
  // are looking for the same catalogue in different languages, and without
  // this a crawler treats one of them as the only version.
  alternates: { canonical: "/" },
  openGraph: {
    siteName: brand.name,
    title: brand.name,
    description: brand.tagline.en,
    url: site.domain,
    type: "website",
    locale: "ja_JP",
    alternateLocale: ["en_SG"],
  },
  twitter: { card: "summary", title: brand.name, description: brand.tagline.en },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Two entries so the browser chrome matches whichever theme is showing,
  // rather than a white bar sitting above a dark page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1217" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The cookie is the answer for a visitor; an account overrides it below.
  let locale = await getLocale();

  // A signed-out visitor is the normal case on "/", so a missing session here
  // is not an error condition.
  let signedIn = false;
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin, locale")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(data?.is_admin);

      /*
       * The account's language wins over the cookie.
       *
       * Pages behind the login wall render from `profile.locale`, while this
       * shell used to render from the cookie alone. Those agreed only by
       * luck — and once a signed-out visitor can set the cookie, a visitor
       * who switches to English and then signs in to a Japanese account gets
       * an English header wrapped around a Japanese page.
       */
      if (isLocale(data?.locale)) locale = data.locale;
    }
  } catch {
    // Supabase not configured yet — render the app signed-out rather than 500.
  }

  const t = getDict(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/*
          Runs before first paint, so a dark-mode user never sees a white flash.
          It has to be inline and blocking for that reason — anything deferred
          to React would apply the class after the page has already been drawn
          in the wrong colours. Falls back to the OS preference when the user
          has not chosen, which is what makes the default feel considered
          rather than arbitrary.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('oma_theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow"
        >
          {locale === "ja" ? "本文へskip" : "Skip to content"}
        </a>

        <SiteHeader locale={locale} signedIn={signedIn} isAdmin={isAdmin} />

        <main id="main" className="mx-auto w-full max-w-app flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>

        <footer className="mt-8 border-t border-line bg-surface">
          <div className="mx-auto flex max-w-app flex-col gap-3 px-4 py-6">
            <Disclaimer t={t} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              <span>© {new Date().getFullYear()} {wordmark(locale)}</span>
              <Link href="/legal/terms" className="rounded hover:text-ink">
                {t.legalTerms}
              </Link>
              <Link href="/legal/privacy" className="rounded hover:text-ink">
                {t.legalPrivacy}
              </Link>
              {/* A form rather than mailto:, so support does not depend on a
                  mailbox existing on the domain — and so a message from a
                  signed-in user arrives already attached to their account. */}
              <Link href="/contact" className="rounded hover:text-ink">
                {t.legalContact}
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
