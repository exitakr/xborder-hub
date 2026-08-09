import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { brand, wordmark } from "@oma/core";
import { site } from "@/lib/site";
import { getDict } from "@oma/core";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDict(locale);

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
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(data?.is_admin);
    }
  } catch {
    // Supabase not configured yet — render the app signed-out rather than 500.
  }

  return (
    <html lang={locale}>
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
              <a href={`mailto:${site.contactEmail}`} className="rounded hover:text-ink">
                {t.legalContact}
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
