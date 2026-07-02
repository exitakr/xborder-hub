"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { questionForDate } from "./dailyQuestions";

const SCHEMA_MISSING = /relation .* does not exist|function .* does not exist/i;

export type DailyThreadResult =
  | { ok: true; id: string }
  | { ok: false; needLogin?: boolean; error?: string };

/**
 * Resolve today's 今日の質問 to its shared thread, creating the thread on
 * first use (SECURITY DEFINER RPC, migration 0013 — authored by the admin
 * account, unique per date). Everyone who taps 答える lands on the same
 * thread and answers as a comment; the thread shows up in /threads like any
 * other DB thread from the moment it exists.
 *
 * The client sends its local date so the thread matches the question the
 * user is looking at; the question itself is recomputed server-side from
 * that date, so the title can't be spoofed.
 */
export async function openDailyQuestionThread(
  dateStr: string,
): Promise<DailyThreadResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, error: "日付の形式が不正です。" };
  }

  const q = questionForDate(new Date(`${dateStr}T00:00:00`));
  const body = `「${q.q}」\n\n今日の質問です。あなたの経験・考えをコメントで教えてください。`;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, needLogin: true };

    const { data, error } = await supabase.rpc(
      "get_or_create_daily_question_thread",
      {
        p_qdate: dateStr,
        p_title: q.q,
        p_body: body,
        p_category: q.category,
      },
    );

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。supabase/migrations/0013_daily_question_threads.sql を実行してください。",
        };
      }
      console.error("[home] openDailyQuestionThread", error);
      return { ok: false, error: "スレッドを開けませんでした。" };
    }
    if (!data) return { ok: false, error: "スレッドを開けませんでした。" };

    revalidatePath("/threads");
    return { ok: true, id: data as string };
  } catch (err) {
    console.error("[home] openDailyQuestionThread (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
