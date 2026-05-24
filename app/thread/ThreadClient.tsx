"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VoteState = "up" | "down" | null;

const COMMENTS = [
  {
    id: "a",
    author: "YT",
    bg: "bg-jade",
    text: "text-ink",
    badge: "経験あり",
    posted: "1時間前",
    body: (
      <>
        全く同じ状況で2年前にShopee入りました。結論、訛りは全く問題ないです。むしろ「Japanese English」は東南アジアで通じやすいので有利かも。
        <br />
        <br />
        意識した点:
        <br />
        1. 結論ファースト(英語面接で迷ったらこれ)
        <br />
        2. 単語を選ぶより、シンプルな表現で繋ぐ
        <br />
        3. 詰まったら「Let me rephrase」で時間を稼ぐ
      </>
    ),
    ups: 18,
    downs: 0,
  },
  {
    id: "b",
    author: "AK",
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
    author: "SK",
    bg: "bg-mustard",
    text: "text-ink",
    badge: null,
    posted: "20分前",
    body: "ItalkiでフィリピンTeacherと面接想定の練習を5回するだけで激変しました。SGD 50くらいで完結します。",
    ups: 8,
    downs: 0,
  },
] as const;

export function ThreadClient({
  isLoggedIn = false,
}: { isLoggedIn?: boolean } = {}) {
  const router = useRouter();
  const [postVote, setPostVote] = useState<VoteState>("up");
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteState>>({
    a: "up",
    b: "up",
    c: "up",
  });
  const [comment, setComment] = useState("");

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
    // TODO: persist via Supabase in Phase 4. Demo: just clear the input.
    setComment("");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-ink/10">
        <div className="container-app py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/threads"
            className="w-9 h-9 rounded-full border-[1.5px] border-ink/15 bg-cream flex items-center justify-center text-ink flex-shrink-0"
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
            className="w-9 h-9 rounded-full border-[1.5px] border-ink/15 bg-cream flex items-center justify-center text-ink flex-shrink-0"
            aria-label="共有"
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
          <article className="bg-paper border-[1.5px] border-ink rounded-3xl p-5 lg:p-7 shadow-pop">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue text-cream font-bold flex items-center justify-center text-sm border-[1.5px] border-ink">
                  RN
                </div>
                <div>
                  <p className="font-bold text-[13px] text-ink">RN さん</p>
                  <p className="text-[11px] text-ink-faint">SIN · 2時間前</p>
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-blue-soft text-blue-deep px-2 py-0.5 rounded-full font-bold border border-blue/30">
                💼 キャリア
              </span>
            </div>

            <h1 className="display font-bold text-[22px] lg:text-[26px] text-ink leading-tight mb-3">
              SG現地Tech企業の面接、英語だけど日本語訛りでも大丈夫?
            </h1>

            <p className="text-[13px] lg:text-[14px] text-ink leading-relaxed">
              来月Shopee/Grabの最終面接を控えています。
              <br />
              <br />
              TOEIC900はあるけど発音はバキバキの日本語訛りで、ローカルやSEAの面接官に通じるか不安です。
              <br />
              <br />
              英語でテクニカルな話はできますが、雑談やライトな会話で言葉に詰まることが多いです。実際に同じ状況を乗り越えた方、どんな対策をされましたか?
            </p>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-dashed border-ink/20">
              <button
                type="button"
                onClick={() =>
                  setPostVote((v) => (v === "up" ? null : "up"))
                }
                className={`vote-btn ${postVote === "up" ? "voted-up" : ""}`}
              >
                👍 23
              </button>
              <button
                type="button"
                onClick={() =>
                  setPostVote((v) => (v === "down" ? null : "down"))
                }
                className={`vote-btn ${postVote === "down" ? "voted-down" : ""}`}
              >
                👎 1
              </button>
              <span className="text-[11px] text-ink-soft font-bold ml-auto">
                💬 14件
              </span>
            </div>
          </article>

          {/* Comments header */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <h2 className="display font-bold text-[16px] text-ink">
              コメント (14件)
            </h2>
            <select className="text-[11px] font-bold text-ink-soft bg-transparent">
              <option>新着順</option>
              <option>👍 順</option>
            </select>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            {COMMENTS.map((c) => (
              <article
                key={c.id}
                className="bg-cream border-[1.5px] border-ink rounded-2xl p-4 shadow-pop-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${c.bg} ${c.text} font-bold flex items-center justify-center text-xs border-[1.5px] border-ink flex-shrink-0`}
                  >
                    {c.author}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[12px] text-ink">
                          {c.author} さん
                        </p>
                        {c.badge && (
                          <span className="text-[9px] uppercase tracking-wider bg-mustard text-ink px-1.5 py-0.5 rounded font-bold">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-faint">{c.posted}</p>
                    </div>
                    <p className="text-[13px] text-ink leading-relaxed">
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

          <button
            type="button"
            className="mt-4 w-full py-3 bg-cream border-[1.5px] border-ink rounded-2xl text-[12px] font-bold shadow-pop-sm text-ink"
          >
            残り11件を見る
          </button>
        </div>
      </main>

      {/* Comment input */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream border-t-[1.5px] border-ink z-40">
        <div className="container-app py-3 flex items-end gap-2.5">
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
            className="flex-1 px-3 py-2 bg-paper border-[1.5px] border-ink rounded-2xl text-[13px] font-medium text-ink resize-none outline-none focus:shadow-pop-sm"
            style={{ maxHeight: 80 }}
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={isLoggedIn && !comment.trim()}
            className="w-11 h-11 bg-ink text-cream rounded-full border-[1.5px] border-ink shadow-pop-sm flex items-center justify-center flex-shrink-0 disabled:opacity-40"
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
    </>
  );
}
