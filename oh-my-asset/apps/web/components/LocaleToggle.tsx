import type { Locale } from "@oma/core";
import { switchLocale } from "@/lib/locale-action";

/**
 * Language switch for signed-out visitors.
 *
 * A plain form posting to a server action rather than a client component: it
 * has no state of its own, and this way it works before any JavaScript has
 * loaded — which is the situation of a first-time visitor on a slow connection,
 * the person most likely to need the page in their own language.
 *
 * The button shows the language it switches *to*, not the one in use. A control
 * labelled with the current state reads as a status display, and people click
 * it expecting confirmation rather than a change.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const next: Locale = locale === "ja" ? "en" : "ja";
  const label = next === "ja" ? "日本語" : "EN";

  return (
    <form action={switchLocale}>
      <input type="hidden" name="locale" value={next} />
      <button
        type="submit"
        // Announced as the destination language, since "EN" alone tells a
        // screen-reader user nothing about what pressing it does.
        aria-label={next === "ja" ? "日本語に切り替える" : "Switch to English"}
        className="rounded-lg px-2 py-2 text-xs font-medium text-muted transition-colors hover:bg-canvas hover:text-ink sm:text-sm"
      >
        {label}
      </button>
    </form>
  );
}
