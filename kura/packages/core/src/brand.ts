/**
 * Single source of truth for product identity, shared by the web and native apps.
 *
 * SPEC §1.1: the working name `KURA / 蔵` is NOT trademark-cleared. Everything
 * reads from this file so that a rename (or an acquirer's rebrand) is a one-file
 * change. Never hardcode the product name in a screen.
 *
 * Deployment-specific values (canonical domain, contact address) are injected by
 * each app instead of being read from `process.env` here: React Native has no
 * `NEXT_PUBLIC_*` and resolves configuration through app.json, not the web env.
 */
export const brand = {
  /** Latin wordmark used in headers, titles, and legal text. */
  name: "KURA",
  /** Japanese wordmark. Shown only in the ja locale. */
  nameJa: "蔵",
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
  applicationId: "com.kuraapp.kura",
  /** Custom URL scheme for auth deep links (kura://). */
  scheme: "kura",
} as const;

/** Wordmark for a given locale. */
export function wordmark(locale: "ja" | "en"): string {
  return locale === "ja" ? `${brand.name}／${brand.nameJa}` : brand.name;
}
