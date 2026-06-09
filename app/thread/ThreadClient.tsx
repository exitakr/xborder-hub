"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LABELS, type Thread } from "@/app/threads/data";
import { addCommentAction } from "./actions";
import type { DisplayComment } from "@/lib/threads/queries";

type VoteState = "up" | "down" | null;

const SAMPLE_COMMENTS: DisplayComment[] = [
  {
    id: "a",
    authorName: "YT",
    initials: "YT",
    bg: "bg-jade",
    text: "text-ink",
    badge: "経験あり",
    posted: "1時間前",
    body: "全く同じ状況で2年前にShopee入りました。結論、訛りは全く問題ないです。むしろ「Japanese English」は東南アジアで通じやすいので有利かも。\n\n意識した点:\n1. 結論ファースト(英語面接で迷ったらこれ)\n2. 単語を選ぶより、シンプルな表現で繋ぐ\n3. 詰まったら「Let me rephrase」で時間を稼ぐ",
    ups: 18,
    downs: 0,
  },
  {
    id: "b",
    authorName: "AK",
    initials: "AK",
    bg: "bg-plum",
    text: "text-cream",
    badge: null,
    posted: "45分前",
    body: "Grabの面接官側経験者です。発音より「STAR形式で答えられるか」を見ています。雑談部分はリラックスして大丈夫!",
    ups: 12,
    downs: 0,
  },
  {
    id: "c",
    authorName: "SK",
    initials: "SK",
    bg: "bg-mustard",
    text: "text-ink",
    badge: null,
    posted: "20分前",
    body: "ItalkiでフィリピンTeacherと面接想定の練習を5回するだけで激変しました。SGD 50くらいで完結します。",
    ups: 8,
    downs: 0,
  },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ThreadClient({
  isLoggedIn = false,
  thread,
  comments = [],
}: {
  isLoggedIn?: boolean;
  thread: Thread;
  comments?: DisplayComment[];
}) {
  const router = useRouter();
  const [postVote, setPostVote] = useState<VoteState>("up");
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteState>>(
    {},
  );
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPersisted = UUID_RE.test(thread.id);
  const displayComments = comments.length > 0 ? comments : SAMPLE_COMMENTS;

  function toggleCommentVote(id: string, kind: "up" | "down") {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/thread")}`);
      return;
    }
    setCommentVotes((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
  }

  function submitComment() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/thread")}`);
      return;
    }
    const body = comment.trim();
    if (!body) return;
    if (!isPersisted) {
      setError(
        "このスレッドはサンプル投稿のため、コメントを保存できません。",
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addCommentAction({ threadId: thread.id, body });
      if (res.ok) {
        setComment("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
        <div className="container-app py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/threads"
            className="w-9 h-9 rounded-full border border-ink/15 bg-cream flex items-center justify-center text-ink flex-shrink-0"
            aria-label="戻る"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="text-center flex-1 min-w-0">
            <div className="display font-bold text-[13px] tracking-tight text-ink truncate">
              スレッド
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const url =
                typeof window !== "undefined" ? window.location.href : "";
              const title = thread.title;
              if (
                typeof navigator !== "undefined" &&
                typeof navigator.share === "function"
              ) {
                try {
                  await navigator.share({ title, url });
                  return;
                } catch {
                  /* ignore — fall through to clipboard */
                }
              }
              try {
                await navigator.clipboard.writeText(url);
                alert("スレッドの URL をコピーしました");
              } catch {
                alert(url);
              }
            }}
            className="w-9 h-9 rounded-full border border-ink/15 bg-cream flex items-center justify-center text-ink hover:border-ink transition-colors flex-shrink-0"
            aria-label="共有"
            title="このスレッドを共有"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </header>

      <main className="container-app py-6 relative z-10 pb-32 lg:pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Original post */}
          <article className="bg-paper border border-ink rounded-3xl p-5 lg:p-7 shadow-pop">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${thread.bg} ${thread.text} font-bold flex items-center justify-center text-sm border border-ink/15`}
                >
                  {thread.author}
                </div>
                <div>
                  <p className="font-bold text-[13px] text-ink">
                    {thread.author} さん
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {thread.location} · {thread.posted}
                  </p>
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30">
                {LABELS.categories[thread.category] ?? thread.category}
              </span>
            </div>

            <h1 className="display font-bold text-[22px] lg:text-[26px] text-ink leading-tight mb-3">
              {thread.title}
            </h1>

            <p className="text-[13px] lg:text-[14px] text-ink leading-relaxed whitespace-pre-line">
              {thread.body}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {thread.country && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-soft text-blue-deep border-blue/30">
                  {LABELS.countries[thread.country] ?? thread.country}
                </span>
              )}
              {thread.industry && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-soft text-blue-deep border-blue/30">
                  {LABELS.industries[thread.industry] ?? thread.industry}
                </span>
              )}
              {thread.role && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-soft text-blue-deep border-blue/30">
                  {LABELS.roles[thread.role] ?? thread.role}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-dashed border-ink/20">
              <button
                type="button"
                onClick={() =>
                  setPostVote((v) => (v === "up" ? null : "up"))
                }
                className={`vote-btn ${postVote === "up" ? "voted-up" : ""}`}
              >
                👍 {thread.ups}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPostVote((v) => (v === "down" ? null : "down"))
                }
                className={`vote-btn ${postVote === "down" ? "voted-down" : ""}`}
              >
                👎 {thread.downs}
              </button>
              <span className="text-[11px] text-ink-soft font-bold ml-auto">
                💬 {thread.replies}件
              </span>
            </div>
          </article>

          {/* Comments header */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <h2 className="display font-bold text-[16px] text-ink">
              コメント ({thread.replies}件)
            </h2>
            <select className="text-[11px] font-bold text-ink-soft bg-transparent">
              <option>新着順</option>
              <option>👍 順</option>
            </select>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            {displayComments.map((c) => (
              <article
                key={c.id}
                className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${c.bg} ${c.text} font-bold flex items-center justify-center text-xs border border-ink flex-shrink-0`}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[12px] text-ink">
                          {c.authorName} さん
                        </p>
                        {c.badge && (
                          <span className="text-[9px] uppercase tracking-wider bg-mustard text-ink px-1.5 py-0.5 rounded font-bold">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-faint">{c.posted}</p>
                    </div>
                    <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">
                      {c.body}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => toggleCommentVote(c.id, "up")}
                        className={`vote-btn ${commentVotes[c.id] === "up" ? "voted-up" : ""}`}
                      >
                        👍 {c.ups}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCommentVote(c.id, "down")}
                        className={`vote-btn ${commentVotes[c.id] === "down" ? "voted-down" : ""}`}
                      >
                        👎 {c.downs}
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-ink-soft font-bold ml-auto"
                      >
                        返信
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>

      {/* Comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream border-t-[1.5px] border-ink z-40">
        <div className="container-app py-3 flex flex-col gap-1.5">
          {error && (
            <p className="text-[11px] font-bold text-red-600">{error}</p>
          )}
          <div className="flex items-end gap-2.5">
          <textarea
            rows={1}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => {
              if (!isLoggedIn) {
                router.push(
                  `/login?next=${encodeURIComponent("/thread")}`,
                );
              }
            }}
            placeholder={
              isLoggedIn ? "コメントを書く..." : "コメントするにはログイン"
            }
            className="flex-1 px-3 py-2 bg-paper border border-ink rounded-2xl text-[13px] font-medium text-ink resize-none outline-none focus:shadow-pop-sm"
            style={{ maxHeight: 80 }}
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={(isLoggedIn && !comment.trim()) || pending}
            className="w-11 h-11 bg-ink text-cream rounded-full border border-ink shadow-pop-sm flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            aria-label="送信"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
          </div>
        </div>
      </div>
    </>
  );
}
