import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LandingHeader } from "@/components/site/LandingHeader";
import { LandingFooter } from "@/components/site/LandingFooter";

export const metadata: Metadata = {
  title: "Legal",
};

/**
 * Shared chrome used by /legal/terms, /legal/privacy, /legal/contact.
 * Keeps the layout consistent: landing chrome + narrow text column.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LandingHeader />
      <main className="container-narrow px-5 py-10 lg:py-16 relative z-10">
        <article className="prose prose-sm lg:prose-base max-w-none text-ink leading-relaxed">
          {children}
        </article>
      </main>
      <LandingFooter />
    </>
  );
}
