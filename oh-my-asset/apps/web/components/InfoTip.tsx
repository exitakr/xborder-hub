"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An "i" that reveals a paragraph.
 *
 * The two caveats under the portfolio total — that unpriced items are excluded,
 * and that some of the figure is self-reported — are both true and both worth
 * saying, and together they were four lines of grey text under the number the
 * screen exists to show. Long disclosure at full length competes with the thing
 * it qualifies, and loses everyone's attention including the people it protects.
 *
 * Hover for a pointer, click or focus for touch and keyboard — a hover-only
 * tooltip is unreachable on the device most of these readers are using. Escape
 * and outside-click both close it, because a panel that can only be dismissed
 * by finding the same small target again is a trap.
 */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold text-muted transition-colors hover:border-muted hover:text-ink"
      >
        i
      </button>

      {open && (
        /*
         * `right-0` so it opens inwards from wherever the icon sits. Anchored
         * left it would run off the right edge of a phone, which is exactly
         * where this icon ends up — at the end of a line of stats.
         */
        <span
          role="tooltip"
          className="absolute right-0 top-6 z-20 w-64 rounded-lg border border-line bg-surface p-3 text-left text-xs leading-relaxed font-normal text-muted shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}
