/**
 * Single source of truth for product identity, shared by the web and native apps.
 *
 * SPEC §1.1: the name is NOT trademark-cleared. Everything reads from this file
 * so that a rename (or an acquirer's rebrand) is a one-file change. Never
 * hardcode the product name in a screen.
 *
 * Deployment-specific values (canonical domain, contact address) are injected by
 * each app instead of being read from `process.env` here: React Native has no
 * `NEXT_PUBLIC_*` and resolves configuration through app.json, not the web env.
 */
export const brand = {
  /** Full wordmark, used in headers, titles, and legal text. */
  name: "Oh My Asset",
  /**
   * Abbreviation, for places where the full name genuinely cannot fit.
   *
   * Deliberately NOT used in the header: swapping the wordmark at a breakpoint
   * made the product look like two different ones depending on the device. The
   * Japanese navigation it was introduced to make room for was fixed by
   * shortening the nav labels instead.
   */
  shortName: "OMA",
  /** Short tagline. Deliberately factual — no investment-advice framing. */
  tagline: {
    ja: "コレクションを、資産として見る。",
    en: "See your collection as a portfolio.",
  },
  /**
   * Reverse-DNS identifier, used for the iOS bundle identifier, the Android
   * application id, and the deep-link scheme. Changing it after a store release
   * creates a NEW app listing — it cannot be edited later.
   */
  applicationId: "com.ohmyasset.app",
  /** Custom URL scheme for auth deep links (oma://). */
  scheme: "oma",
} as const;

/**
 * Wordmark for a given locale.
 *
 * The name is English in both locales: it is a proper noun, and a transliterated
 * second form would read as a different product rather than the same one.
 */
export function wordmark(_locale: "ja" | "en"): string {
  return brand.name;
}
