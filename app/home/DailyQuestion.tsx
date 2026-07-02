"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStreak } from "@/lib/streak";
import { questionForDate, type DailyQuestion as DQ } from "./dailyQuestions";

/**
 * Home-page daily prompt. The question rotates once per day (deterministic
 * by date) and the CTA drops the user into /thread/new with the title and
 * category prefilled. Also shows the visit streak once it reaches 2 days.
 *
 * Rendered only after mount so the SSR HTML never disagrees with the
 * client's local date / localStorage streak (avoids hydration mismatch).
 */
export function DailyQuestion() {
  const [q, setQ] = useState<DQ | null>(null);
  const streak = useStreak();

  useEffect(() => {
    setQ(questionForDate(new Date()));
  }, []);

  if (!q) return null;

  const href = `/thread/new?title=${encodeURIComponent(q.q)}&category=${q.category}`;

  return (
    <section className="rise" style={{ animationDelay: "0.02s" }}>
      <div className="bg-paper border border-ink/10 rounded-2xl shadow-pop-sm px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue font-bold whitespace-nowrap">
              📝 今日の質問
            </p>
            {streak >= 2 && (
              <span className="text-[10px] font-bold text-ink-soft bg-mustard/30 border border-mustard/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                🔥 {streak}日連続
              </span>
            )}
          </div>
          <p className="display font-bold text-[14px] lg:text-[15px] text-ink leading-snug mt-1">
            {q.q}
          </p>
        </div>
        <Link
          href={href}
          className="flex-none bg-ink text-cream font-bold text-[12px] px-4 py-2 rounded-full hover:bg-blue-deep transition-colors"
        >
          答える →
        </Link>
      </div>
    </section>
  );
}
