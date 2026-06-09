"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";
import {
  DEFAULT_PUSH_PREFS,
  KIND_ICON,
  KIND_LABEL,
  requestPushPermission,
  timeAgo,
  useNotifications,
  usePushPrefs,
  type AppNotification,
  type NotificationKind,
  type PushPrefs,
} from "@/lib/notifications/store";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";

type Filter =
  | "all"
  | "thread_post"
  | "thread_reply"
  | "reaction"
  | "system"
  | "dm";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全て" },
  { id: "thread_post", label: "新規投稿" },
  { id: "thread_reply", label: "返信" },
  { id: "reaction", label: "リアクション" },
  { id: "system", label: "お知らせ" },
  { id: "dm", label: "ダイレクト" },
];

const PREF_ROWS: { key: keyof PushPrefs; label: string; hint?: string }[] = [
  { key: "thread_post", label: "新規投稿" },
  { key: "thread_reply", label: "あなたの投稿への返信" },
  { key: "reaction", label: "あなたの投稿へのリアクション" },
  { key: "new_salary", label: "新規年収投稿" },
  { key: "system", label: "X Border Hub からのお知らせ" },
  { key: "new_job", label: "新求人" },
  { key: "dm", label: "ダイレクトメッセージ" },
  { key: "chat_approved", label: "Coffee Chat の承認 / 申請" },
];

export function NotificationsClient({
  initialServerNotifs = [],
}: {
  initialServerNotifs?: AppNotification[];
} = {}) {
  const {
    list,
    unread,
    markRead,
    markAllRead,
    clear,
    mergeServerNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (initialServerNotifs.length > 0) {
      mergeServerNotifications(initialServerNotifs);
    }
    // Only run once on mount with the server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMarkRead(id: string) {
    markRead(id);
    // Fire-and-forget — DB row may not exist for locally-generated notifs.
    void markNotificationReadAction(id);
  }

  function handleMarkAllRead() {
    markAllRead();
    void markAllNotificationsReadAction();
  }

  const visible = useMemo<AppNotification[]>(() => {
    if (filter === "all") return list;
    return list.filter((n) => n.kind === filter);
  }, [list, filter]);

  return (
    <>
      <AppTopBar />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="app-grid">
          <div className="app-grid-main space-y-4">
            <section className="flex items-end justify-between gap-3 rise">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
                  🔔 notifications
                </p>
                <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
                  通知
                  {unread > 0 && (
                    <span className="ml-2 text-[12px] align-middle text-blue">
                      {unread}件 未読
                    </span>
                  )}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-ink-soft underline underline-offset-2"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="通知設定"
                  className="w-9 h-9 rounded-full border border-ink/15 bg-cream flex items-center justify-center text-ink hover:border-ink transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </section>

            {/* Filter chips */}
            <section className="rise" style={{ animationDelay: "0.04s" }}>
              <div className="flex gap-1.5 overflow-x-auto hide-scroll">
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`flex-none px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors ${
                        active
                          ? "bg-ink text-cream border-ink"
                          : "bg-cream text-ink-soft border-ink/15 hover:border-ink"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* List */}
            <section>
              {visible.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">🕊</p>
                  <p className="display font-bold text-[14px] text-ink">
                    通知はまだありません
                  </p>
                  <p className="text-[11px] text-ink-soft mt-1">
                    スレッドへの返信や Coffee Chat の承認がここに届きます。
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {visible.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href ?? "#"}
                        onClick={() => handleMarkRead(n.id)}
                        className="block py-4 flex items-start gap-3 hover:bg-paper transition-colors px-2 -mx-2 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-lg bg-cream border border-ink/15 flex items-center justify-center text-base flex-shrink-0">
                          {KIND_ICON[n.kind as NotificationKind]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-ink-soft font-bold">
                            {n.group && (
                              <span className="text-ink">{n.group} · </span>
                            )}
                            {KIND_LABEL[n.kind as NotificationKind]} ·{" "}
                            <span className="text-ink-faint">
                              {timeAgo(n.createdAt)}
                            </span>
                          </p>
                          <p className="text-[14px] text-ink font-bold leading-tight mt-0.5">
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-[12px] text-ink-soft mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                        </div>
                        {!n.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-jade-deep mt-3 flex-shrink-0"
                            aria-label="未読"
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {list.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("通知履歴をすべて削除しますか?")) clear();
                  }}
                  className="mt-6 text-[11px] text-ink-faint font-bold underline"
                >
                  履歴をクリア
                </button>
              )}
            </section>
          </div>
        </div>
      </main>

      <PushSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <BottomNavMobile active="notifications" />
    </>
  );
}

function PushSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [prefs, setPrefs] = usePushPrefs();
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied",
  );

  async function toggle(key: keyof PushPrefs, next: boolean) {
    if (next && perm !== "granted") {
      const result = await requestPushPermission();
      setPerm(result);
      if (result !== "granted") {
        // Browser denied push — keep the toggle ON but remind the user.
        alert(
          "ブラウザのプッシュ通知が許可されていません。設定 → 通知 から許可してください。",
        );
      }
    }
    setPrefs((p) => ({ ...p, [key]: next }));
  }

  function setAll(next: boolean) {
    const all: PushPrefs = { ...DEFAULT_PUSH_PREFS };
    for (const k of Object.keys(all) as (keyof PushPrefs)[]) all[k] = next;
    setPrefs(all);
  }

  return (
    <>
      <div
        className={`modal-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`modal-sheet ${open ? "open" : ""}`}>
        <div className="px-5 lg:px-7 pt-3 pb-6">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4 lg:hidden" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
                push notifications
              </p>
              <h3 className="display font-bold text-[20px] text-ink mt-1">
                プッシュ通知設定
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="w-8 h-8 rounded-full bg-paper border border-ink/15 flex items-center justify-center text-ink"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Permission status */}
          <div className="mb-3 flex items-center justify-between gap-3 bg-paper border border-ink/15 rounded-xl px-3 py-2">
            <div>
              <p className="text-[12px] font-bold text-ink">
                ブラウザ通知の許可
              </p>
              <p className="text-[11px] text-ink-soft">
                {perm === "granted"
                  ? "✅ 許可済み — デバイスに通知が届きます"
                  : perm === "denied"
                    ? "🚫 ブロック中 — ブラウザ設定から許可してください"
                    : "未設定 — オンにすると許可ダイアログが出ます"}
              </p>
            </div>
            {perm !== "granted" && (
              <button
                type="button"
                onClick={async () => setPerm(await requestPushPermission())}
                className="text-[11px] font-bold text-blue underline"
              >
                許可する
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {PREF_ROWS.map((row) => (
              <label
                key={row.key}
                className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-paper transition-colors cursor-pointer"
              >
                <span className="text-[13px] font-bold text-ink">
                  {row.label}
                </span>
                <ToggleSwitch
                  on={prefs[row.key]}
                  onChange={(next) => toggle(row.key, next)}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-ink/15">
            <button
              type="button"
              onClick={() => setAll(false)}
              className="text-[11px] text-ink-soft font-bold underline"
            >
              すべてオフ
            </button>
            <button
              type="button"
              onClick={() => setAll(true)}
              className="text-[11px] text-blue font-bold underline"
            >
              すべてオン
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleSwitch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-jade-deep" : "bg-ink/15"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
