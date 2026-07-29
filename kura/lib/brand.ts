/**
 * Single source of truth for product identity.
 *
 * SPEC §1.1: the working name `KURA / 蔵` is NOT trademark-cleared. Every screen
 * reads from this file so that a rename (or an acquirer's rebrand) is a one-file
 * change. Never hardcode the product name in a component.
 *
 * To rename: change `name`, `nameJa`, and `domain`. Nothing else should need edits.
 */
export const brand = {
  /** Latin wordmark used in headers, <title>, and legal text. */
  name: "KURA",
  /** Japanese wordmark. Shown only in the ja locale. */
  nameJa: "蔵",
  /** Short tagline. Deliberately factual — no investment-advice framing. */
  tagline: {
    ja: "コレクションを、資産として見る。",
    en: "See your collection as a portfolio.",
  },
  /** Canonical production origin, used for metadata and OG tags. */
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Contact address surfaced in legal pages. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@example.com",
} as const;

/** Wordmark for a given locale. */
export function wordmark(locale: "ja" | "en"): string {
  return locale === "ja" ? `${brand.name}／${brand.nameJa}` : brand.name;
}
