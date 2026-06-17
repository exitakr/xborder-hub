"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, LABELS, ROLES } from "@/app/threads/data";
import {
  addCommentAction,
  deleteThreadAction,
  toggleReactionAction,
  updateThreadAction,
} from "./actions";
import type { DisplayComment, DisplayThread } from "@/lib/threads/queries";

type VoteState = "up" | "down" | null;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ThreadClient({
  isLoggedIn = false,
  isAuthor = false,
  thread,
  comments = [],
}: {
  isLoggedIn?: boolean;
  isAuthor?: boolean;
  thread: DisplayThread;
  comments?: DisplayComment[];
}) {
  const router = useRouter();
  const [postVote, setPostVote] = useState<VoteState>(null);
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteState>>(
    {},
  );
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<DisplayComment | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [editBody, setEditBody] = useState(thread.body);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, startEdit] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, startDelete] = useTransition();
  const [deleteToast, setDeleteToast] = useState(false);
  const [editedJustNow, setEditedJustNow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPersisted = UUID_RE.test(thread.id);
  const isEdited = thread.edited || editedJustNow;

  // Close the 3-dot menu when the user clicks outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  function openEdit() {
    setMenuOpen(false);
    setEditTitle(thread.title);
    setEditBody(thread.body);
    setEditError(null);
    setEditOpen(true);
  }

  function submitEdit() {
    setEditError(null);
    startEdit(async () => {
      const res = await updateThreadAction({
        threadId: thread.id,
        title: editTitle,
        body: editBody,
      });
      if (res.ok) {
        setEditOpen(false);
        setEditedJustNow(true);
        router.refresh();
      } else {
        setEditError(res.error);
      }
    });
  }

  function submitDelete() {
    startDelete(async () => {
      const res = await deleteThreadAction({ threadId: thread.id });
      if (res.ok) {
        setConfirmDelete(false);
        setDeleteToast(true);
        // Brief toast then navigate to the list. revalidatePath() on the
        // server makes /threads reflect the deletion immediately.
        setTimeout(() => router.push("/threads"), 1100);
      } else {
        setEditError(res.error);
        setConfirmDelete(false);
      }
    });
  }

  // Group nested replies under their parent so the UI mirrors the
  // indented "返信" rows from the reference screenshot.
  const { topLevel, repliesBy } = useMemo(() => {
    const top: DisplayComment[] = [];
    const byParent = new Map<string, DisplayComment[]>();
    for (const c of comments) {
      if (c.parentId && comments.some((p) => p.id === c.parentId)) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      } else {
        top.push(c);
      }
    }
    return { topLevel: top, repliesBy: byParent };
  }, [comments]);

  // Page-header subtitle mirrors the screenshots: when the post is
  // tagged with a role we surface that, otherwise the category.
  const headerSubtitle = useMemo(() => {
    const roleLabel = ROLES.find((r) => r.v === thread.role)?.label;
    if (roleLabel) return roleLabel;
    return CATEGORIES.find((c) => c.v === thread.category)?.label
      ?.replace(/^[^\p{L}\p{N}]+\s*/u, "")
      .trim();
  }, [thread.role, thread.category]);

  function loginGate(returnTo = `/thread?id=${thread.id}`) {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
      return false;
    }
    return true;
  }

  function togglePostVote(kind: "up" | "down") {
    if (!loginGate()) return;
    setPostVote((v) => (v === kind ? null : kind));
    if (isPersisted) {
      void toggleReactionAction({
        targetType: "thread",
        targetId: thread.id,
        kind,
      });
    }
  }

  function toggleCommentVote(id: string, kind: "up" | "down") {
    if (!loginGate()) return;
    setCommentVotes((v) => ({ ...v, [id]: v[id] === kind ? null : kind }));
    if (UUID_RE.test(id)) {
      void toggleReactionAction({
        targetType: "comment",
        targetId: id,
        kind,
      });
    }
  }

  function startReply(c: DisplayComment) {
    if (!loginGate()) return;
    setReplyTo(c);
    setTimeout(() => commentInputRef.current?.focus(), 0);
  }

  function focusInput() {
    if (!loginGate()) return;
    setReplyTo(null);
    commentInputRef.current?.focus();
  }

  function submitComment() {
    if (!loginGate()) return;
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
      const res = await addCommentAction({
        threadId: thread.id,
        body,
        parentId: replyTo?.id ?? null,
      });
      if (res.ok) {
        setComment("");
        setReplyTo(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper border-b border-ink/10">
        <div className="container-app py-3 flex items-center gap-3">
          <Link
            href="/threads"
            className="w-8 h-8 flex items-center justify-center text-ink flex-shrink-0"
            aria-label="戻る"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="display font-bold text-[15px] tracking-tight text-ink leading-tight">
              投稿
            </div>
            {headerSubtitle && (
              <div className="text-[11px] text-ink-soft truncate">
                {headerSubtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              const url =
                typeof window !== "undefined" ? window.location.href : "";
              if (
                typeof navigator !== "undefined" &&
                typeof navigator.share === "function"
              ) {
                try {
                  await navigator.share({ title: thread.title, url });
                  return;
                } catch {
                  /* fall through */
                }
              }
              try {
                await navigator.clipboard.writeText(url);
                alert("スレッドの URL をコピーしました");
              } catch {
                alert(url);
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-ink-soft flex-shrink-0"
            aria-label="共有"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <circle cx="18" cy="18" r="2.5" />
              <path d="M8.5 11l7-3.5M8.5 13l7 3.5" />
            </svg>
          </button>
        </div>
      </header>

      <main className="bg-paper min-h-screen pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Original post */}
          <article className="px-5 py-5 border-b border-ink/10">
            <div className="relative">
              <AuthorLine
                label={thread.authorLabel}
                handle={thread.authorHandle}
                verified={thread.authorVerified}
                posted={thread.posted}
                edited={isEdited}
                showMenu={isAuthor && isPersisted}
                onMenuClick={() => setMenuOpen((v) => !v)}
              />
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-6 z-30 bg-paper border border-ink rounded-xl shadow-pop overflow-hidden w-32"
                >
                  <button
                    type="button"
                    onClick={openEdit}
                    className="w-full text-left px-3 py-2 text-[12px] font-bold text-ink hover:bg-cream"
                  >
                    ✎ 編集
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-600 hover:bg-cream border-t border-ink/10"
                  >
                    🗑 削除
                  </button>
                </div>
              )}
            </div>
            <h1 className="display font-bold text-[19px] lg:text-[22px] text-ink leading-snug mt-3">
              {thread.title}
            </h1>
            <p className="text-[14px] text-ink leading-relaxed whitespace-pre-line mt-2">
              {thread.body}
            </p>

            <ReactionBar
              up={thread.ups + (postVote === "up" ? 1 : 0)}
              down={thread.downs + (postVote === "down" ? 1 : 0)}
              replies={thread.replies}
              voted={postVote}
              onUp={() => togglePostVote("up")}
              onDown={() => togglePostVote("down")}
              onReply={focusInput}
            />
          </article>

          {/* Comments header — mirrors the "最新コメント" divider */}
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
              最新コメント
            </p>
          </div>

          {/* Comments */}
          <div className="px-5 space-y-5">
            {topLevel.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-2xl mb-1">💬</p>
                <p className="display font-bold text-[14px] text-ink">
                  まだコメントがありません
                </p>
                <p className="text-[11px] text-ink-soft mt-1">
                  最初のコメントを書いてみましょう。
                </p>
              </div>
            )}
            {topLevel.map((c) => {
              const replies = repliesBy.get(c.id) ?? [];
              return (
                <div key={c.id} className="space-y-3">
                  <CommentRow
                    c={c}
                    voted={commentVotes[c.id] ?? null}
                    onUp={() => toggleCommentVote(c.id, "up")}
                    onDown={() => toggleCommentVote(c.id, "down")}
                    onReply={() => startReply(c)}
                  />
                  {replies.map((r) => (
                    <div key={r.id} className="pl-8">
                      <CommentRow
                        c={r}
                        voted={commentVotes[r.id] ?? null}
                        onUp={() => toggleCommentVote(r.id, "up")}
                        onDown={() => toggleCommentVote(r.id, "down")}
                        onReply={() => startReply(c)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Comment input — fixed at bottom, matches screenshot footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper border-t border-ink/10 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {replyTo && (
            <div className="flex items-center justify-between text-[11px] text-ink-soft mb-1.5">
              <span>
                <span className="font-bold">{replyTo.authorLabel}</span> に返信
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-bold underline"
              >
                キャンセル
              </button>
            </div>
          )}
          {error && (
            <p className="text-[11px] font-bold text-red-600 mb-1.5">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <textarea
              ref={commentInputRef}
              rows={1}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => {
                if (!isLoggedIn) {
                  router.push(
                    `/login?next=${encodeURIComponent(`/thread?id=${thread.id}`)}`,
                  );
                }
              }}
              placeholder={
                isLoggedIn ? "コメントを追加" : "コメントするにはログイン"
              }
              className="flex-1 px-3 py-2 bg-cream border border-ink/15 rounded-full text-[13px] text-ink resize-none outline-none focus:border-ink"
              style={{ maxHeight: 96 }}
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={(isLoggedIn && !comment.trim()) || pending}
              className="w-9 h-9 bg-ink text-cream rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30"
              aria-label="送信"
            >
              <svg
                width="16"
                height="16"
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

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-end lg:items-center justify-center"
          onClick={() => !editPending && setEditOpen(false)}
        >
          <div
            className="bg-paper w-full lg:max-w-lg lg:rounded-2xl rounded-t-2xl border border-ink shadow-pop p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="display font-bold text-[16px] text-ink">投稿を編集</h2>
              <button
                type="button"
                onClick={() => !editPending && setEditOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-ink-soft"
                aria-label="閉じる"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label className="label">タイトル</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={120}
              className="field mb-3"
            />
            <label className="label">本文</label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              maxLength={4000}
              rows={8}
              className="field"
            />
            {editError && (
              <p className="text-[11px] font-bold text-red-600 mt-2">{editError}</p>
            )}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => !editPending && setEditOpen(false)}
                className="px-4 py-2 text-[12px] font-bold text-ink-soft"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={editPending}
                className="btn-primary px-5 disabled:opacity-50"
              >
                {editPending ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center px-5"
          onClick={() => !deletePending && setConfirmDelete(false)}
        >
          <div
            className="bg-paper border border-ink rounded-2xl shadow-pop p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="display font-bold text-[15px] text-ink">投稿を削除しますか?</p>
            <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed">
              削除すると元に戻せません。コメントも一緒に削除されます。
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => !deletePending && setConfirmDelete(false)}
                className="px-4 py-2 text-[12px] font-bold text-ink-soft"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitDelete}
                disabled={deletePending}
                className="px-5 py-2 rounded-full text-[12px] font-bold bg-red-600 text-cream border border-red-700 disabled:opacity-50"
              >
                {deletePending ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation toast */}
      {deleteToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ink text-cream text-[12px] font-bold px-4 py-2 rounded-full shadow-pop">
          ✓ 投稿を削除しました
        </div>
      )}
    </>
  );
}

/* ────────────────────────── helpers ────────────────────────── */

function AuthorLine({
  label,
  handle,
  verified,
  posted,
  small = false,
  edited = false,
  showMenu = false,
  onMenuClick,
}: {
  label: string;
  handle: string;
  verified: boolean;
  posted: string;
  small?: boolean;
  edited?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}) {
  const size = small ? "text-[11px]" : "text-[12px]";
  return (
    <div className={`flex items-center gap-1 ${size} text-ink-soft`}>
      <span className="font-bold text-ink truncate">{label}</span>
      <span>·</span>
      <span className="font-mono text-ink-faint">{handle}</span>
      <span>·</span>
      <span>{posted}</span>
      {edited && (
        <span className="text-ink-faint italic ml-0.5">(編集済み)</span>
      )}
      {verified && (
        <svg
          width={small ? 11 : 12}
          height={small ? 11 : 12}
          viewBox="0 0 24 24"
          className="text-blue ml-0.5"
          aria-label="認証済み"
        >
          <path
            fill="currentColor"
            d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          />
          <path
            d="M22 4 12 14.01l-3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {showMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          className="ml-auto text-ink-faint px-1 py-0.5"
          aria-label="メニュー"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ReactionBar({
  up,
  down,
  replies,
  voted,
  onUp,
  onDown,
  onReply,
}: {
  up: number;
  down: number;
  replies: number;
  voted: VoteState;
  onUp: () => void;
  onDown: () => void;
  onReply: () => void;
}) {
  return (
    <div className="flex items-center gap-4 mt-4 text-ink-soft text-[12px]">
      <button
        type="button"
        onClick={onUp}
        className={`flex items-center gap-1 ${voted === "up" ? "text-blue font-bold" : ""}`}
        aria-label="いいね"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 11v9H4v-9zM7 11l4-7c.8 0 1.5.7 1.5 1.5V10h5.6c1 0 1.8.9 1.6 1.9l-1.4 7c-.2 1-1 1.6-2 1.6H7" />
        </svg>
        <span>{up}</span>
      </button>
      <button
        type="button"
        onClick={onDown}
        className={`flex items-center gap-1 ${voted === "down" ? "text-red-500 font-bold" : ""}`}
        aria-label="よくない"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 13V4h3v9zM17 13l-4 7c-.8 0-1.5-.7-1.5-1.5V14H6c-1 0-1.8-.9-1.6-1.9l1.4-7c.2-1 1-1.6 2-1.6H17" />
        </svg>
        <span>{down > 0 ? down : ""}</span>
      </button>
      <button
        type="button"
        onClick={onReply}
        className="flex items-center gap-1"
        aria-label="コメント"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
        <span>{replies}</span>
      </button>
      <button type="button" className="ml-auto" aria-label="保存">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}

function CommentRow({
  c,
  voted,
  onUp,
  onDown,
  onReply,
}: {
  c: DisplayComment;
  voted: VoteState;
  onUp: () => void;
  onDown: () => void;
  onReply: () => void;
}) {
  return (
    <div>
      <AuthorLine
        label={c.authorLabel}
        handle={c.authorHandle}
        verified={c.authorVerified}
        posted={c.posted}
        small
      />
      <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line mt-1">
        {c.body}
      </p>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-soft">
        <button
          type="button"
          onClick={onUp}
          className={`flex items-center gap-1 ${voted === "up" ? "text-blue font-bold" : ""}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 11v9H4v-9zM7 11l4-7c.8 0 1.5.7 1.5 1.5V10h5.6c1 0 1.8.9 1.6 1.9l-1.4 7c-.2 1-1 1.6-2 1.6H7" />
          </svg>
          <span>{c.ups}</span>
        </button>
        <button
          type="button"
          onClick={onDown}
          className={`flex items-center gap-1 ${voted === "down" ? "text-red-500 font-bold" : ""}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 13V4h3v9zM17 13l-4 7c-.8 0-1.5-.7-1.5-1.5V14H6c-1 0-1.8-.9-1.6-1.9l1.4-7c.2-1 1-1.6 2-1.6H17" />
          </svg>
          <span>{c.downs > 0 ? c.downs : ""}</span>
        </button>
        <button
          type="button"
          onClick={onReply}
          className="ml-auto font-bold text-ink-soft"
        >
          返信
        </button>
      </div>
    </div>
  );
}

// Suppress legacy "_" unused import warnings if any tooling tries to inspect.
void LABELS;
