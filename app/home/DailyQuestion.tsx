"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStreak } from "@/lib/streak";
import { openDailyQuestionThread } from "./actions";
import { questionForDate, type DailyQuestion as DQ } from "./dailyQuestions";

/**
 * Home-page daily prompt. The question rotates once per day (deterministic
 * by date). 答える opens the shared thread for today's question — created
 * lazily on first tap (migration 0013) — so everyone answers in one place
 * as comments. Also shows the visit streak once it reaches 2 days.
 *
 * Rendered only after mount so the SSR HTML never disagrees with the
 * client's local date / localStorage streak (avoids hydration mismatch).
 */
export function DailyQuestion() {
  const router = useRouter();
  const [q, setQ] = useState<DQ | null>(null);
  const [dateStr, setDateStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const streak = useStreak();

  useEffect(() => {
    const now = new Date();
    setQ(questionForDate(now));
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setDateStr(`${y}-${m}-${d}`);
  }, []);

  if (!q) return null;

  function answer() {
    setError(null);
    startTransition(async () => {
      const res = await openDailyQuestionThread(dateStr);
      if (res.ok) {
        router.push(`/thread?id=${res.id}`);
        return;
      }
      if (res.needLogin) {
        router.push(`/login?next=${encodeURIComponent("/home")}`);
        return;
      }
      setError(res.error ?? "スレッドを開けませんでした。");
    });
  }

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
          {error && (
            <p className="text-[11px] font-bold text-red-600 mt-1">{error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={answer}
          disabled={pending}
          className="flex-none bg-ink text-cream font-bold text-[12px] px-4 py-2 rounded-full hover:bg-blue-deep transition-colors disabled:opacity-50"
        >
          {pending ? "開いています…" : "答える →"}
        </button>
      </div>
    </section>
  );
}
