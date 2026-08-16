"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Catalogue search that reacts as you type.
 *
 * It was a plain GET form, which meant every query needed Enter — and, worse,
 * clearing the box did nothing until you pressed Enter on the empty field. So
 * deleting your search left the filtered results on screen with no visible
 * reason, and the way back to the full list was a keystroke nobody would guess.
 *
 * The URL stays the source of truth rather than component state: results are
 * server-rendered, the query is shareable and survives a reload, and the back
 * button still works. `replace` rather than `push` so typing eight characters
 * does not bury the previous page under eight history entries.
 */
export function SearchBox({
  placeholder,
  initial,
  category,
}: {
  placeholder: string;
  initial: string;
  category: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // The string, not the object: `useSearchParams()` returns a fresh instance on
  // every render, so depending on it re-ran the effect continuously and the
  // cleanup cleared the debounce timer before it could ever fire — the URL
  // never changed and the search silently did nothing.
  const paramString = useSearchParams().toString();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  // Skips the navigation that would otherwise fire on mount for the value the
  // server already rendered.
  const lastPushed = useRef(initial);

  /*
   * Follow the URL when it changes underneath us — the back button, or a
   * category chip carrying a different `q`. Without this the box keeps showing
   * what was typed while the results behind it show something else, which is
   * the same "the field and the list disagree" complaint in a new place.
   */
  useEffect(() => {
    if (initial === lastPushed.current) return;
    lastPushed.current = initial;
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    const term = value.trim();
    if (term === lastPushed.current) return;

    const timer = setTimeout(() => {
      lastPushed.current = term;

      const next = new URLSearchParams(paramString);
      // Deleted rather than set to "": an empty `?q=` in the address bar reads
      // as a search for nothing, and this is the path back to the full list.
      if (term) next.set("q", term);
      else next.delete("q");

      startTransition(() => {
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [value, paramString, pathname, router]);

  return (
    <div className="relative">
      {/* Still a form: submitting is a no-op because the results are already
          live, but on a phone keyboard the Enter key is labelled 検索 and must
          do something predictable — here, dismiss the keyboard. */}
      <form
        onSubmit={(e) => e.preventDefault()}
        role="search"
        className="flex gap-2"
      >
        {category && <input type="hidden" name="c" value={category} />}
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className="field"
        />
      </form>

      {/* A quiet progress hint. Without it, a slow network looks like a search
          box that ignores you. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-line border-t-accent transition-opacity ${
          pending ? "animate-spin opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
