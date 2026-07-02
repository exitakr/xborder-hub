"use client";

import { useEffect, useState } from "react";

const KEY = "xbh.streak.v1";

type StreakRecord = { last: string; count: number };

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Consecutive-day visit streak, tracked per device in localStorage.
 * On mount: same day → unchanged; yesterday → +1; anything else → reset to 1.
 * Returns 0 until mounted (so SSR markup never shows a streak).
 */
export function useStreak(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const now = new Date();
      const today = localDateString(now);
      const yesterday = localDateString(new Date(now.getTime() - 86400000));

      let rec: StreakRecord = { last: "", count: 0 };
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StreakRecord>;
        if (typeof parsed.last === "string" && typeof parsed.count === "number") {
          rec = { last: parsed.last, count: parsed.count };
        }
      }

      let next: StreakRecord;
      if (rec.last === today) {
        next = rec;
      } else if (rec.last === yesterday) {
        next = { last: today, count: rec.count + 1 };
      } else {
        next = { last: today, count: 1 };
      }

      if (next.last !== rec.last || next.count !== rec.count) {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
      setCount(next.count);
    } catch {
      // storage disabled — streak simply stays hidden
    }
  }, []);

  return count;
}
