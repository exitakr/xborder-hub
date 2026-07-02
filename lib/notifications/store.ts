"use client";

import { useCallback, useEffect, useState } from "react";

/* ──────────────── Types ──────────────── */

export type NotificationKind =
  | "thread_post"
  | "thread_reply"
  | "reaction"
  | "system"
  | "dm"
  | "chat_approved"
  | "chat_request"
  | "new_job"
  | "new_salary";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  /** Community / community-like label, e.g. "雑談", "テックラウンジ" */
  group?: string;
  title: string;
  /** Short body / preview */
  body?: string;
  href?: string;
  read: boolean;
  /** ISO datetime when this was emitted */
  createdAt: string;
};

export type PushPrefs = {
  thread_post: boolean;
  thread_reply: boolean;
  reaction: boolean;
  system: boolean;
  dm: boolean;
  chat_approved: boolean;
  new_job: boolean;
  new_salary: boolean;
};

export const DEFAULT_PUSH_PREFS: PushPrefs = {
  thread_post: true,
  thread_reply: true,
  reaction: true,
  system: true,
  dm: true,
  chat_approved: true,
  new_job: true,
  new_salary: true,
};

/* ──────────────── Storage keys ──────────────── */

const NOTIFS_KEY = "xbh.notifications.v1";
const PREFS_KEY = "xbh.push_prefs.v1";

/* ──────────────── Seed (for the empty demo state) ──────────────── */

const seed: AppNotification[] = [
  {
    id: "n-seed-1",
    kind: "thread_post",
    group: "テックラウンジ",
    title: "外資 PM の評価制度、日系と何がどう違うか",
    body: "OKR や 360 レビューの実際の運用、昇進判定のリアル…",
    href: "/thread?id=6",
    read: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n-seed-2",
    kind: "thread_reply",
    group: "雑談",
    title: "あなたのコメントに返信があります",
    body: "「ItalkiでフィリピンTeacherと…」",
    href: "/thread?id=1",
    read: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n-seed-3",
    kind: "system",
    title: "Coffee Chat の受付を有効化しました",
    body: "プロフィールに「⚡ 相談可」バッジが表示されています。",
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/* ──────────────── Notification store ──────────────── */

const notifListeners = new Set<() => void>();
let notifCache: AppNotification[] | null = null;

function readNotifs(): AppNotification[] {
  if (notifCache) return notifCache;
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(NOTIFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppNotification[];
      notifCache = Array.isArray(parsed) ? parsed : seed;
      return notifCache;
    }
  } catch {
    // fall through to seed
  }
  notifCache = seed;
  return notifCache;
}

function writeNotifs(next: AppNotification[]) {
  notifCache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(NOTIFS_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / disabled storage
    }
  }
  for (const l of notifListeners) l();
}

/**
 * Wipe persisted notifications AND the in-memory cache. Called on sign-out
 * so the next account on this browser doesn't see the previous user's feed.
 */
export function resetLocalNotifications() {
  notifCache = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(NOTIFS_KEY);
    } catch {
      // ignore
    }
  }
  for (const l of notifListeners) l();
}

export function useNotifications() {
  const [list, setList] = useState<AppNotification[]>(seed);

  useEffect(() => {
    setList(readNotifs());
    const onChange = () => setList(readNotifs());
    notifListeners.add(onChange);
    return () => {
      notifListeners.delete(onChange);
    };
  }, []);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read"> & {
      read?: boolean;
    }) => {
      const full: AppNotification = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...n,
      };
      writeNotifs([full, ...readNotifs()]);
      // Try to deliver a system push if the user has opted in and granted
      // browser permission. This is best-effort — failures are silently
      // ignored so the in-app notification still lands.
      void tryDeliverPush(full);
    },
    [],
  );

  const markRead = useCallback((id: string) => {
    writeNotifs(
      readNotifs().map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    writeNotifs(readNotifs().map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    writeNotifs([]);
  }, []);

  /** Merge server-side notifications into the local store on mount. Existing
   * local items (matched by id) are overwritten by the server copy; the rest
   * are kept so locally-fired notifications still show up. */
  const mergeServerNotifications = useCallback((incoming: AppNotification[]) => {
    if (incoming.length === 0) return;
    const current = readNotifs();
    const byId = new Map<string, AppNotification>();
    for (const n of current) byId.set(n.id, n);
    for (const n of incoming) byId.set(n.id, n);
    const next = Array.from(byId.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    writeNotifs(next);
  }, []);

  const unread = list.filter((n) => !n.read).length;

  return {
    list,
    unread,
    addNotification,
    markRead,
    markAllRead,
    clear,
    mergeServerNotifications,
  };
}

/* ──────────────── Push preferences ──────────────── */

const prefsListeners = new Set<() => void>();
let prefsCache: PushPrefs | null = null;

function readPrefs(): PushPrefs {
  if (prefsCache) return prefsCache;
  if (typeof window === "undefined") return DEFAULT_PUSH_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PushPrefs>;
      prefsCache = { ...DEFAULT_PUSH_PREFS, ...parsed };
      return prefsCache;
    }
  } catch {
    // fall through
  }
  prefsCache = DEFAULT_PUSH_PREFS;
  return prefsCache;
}

function writePrefs(next: PushPrefs) {
  prefsCache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  for (const l of prefsListeners) l();
}

export function usePushPrefs() {
  const [prefs, setLocal] = useState<PushPrefs>(DEFAULT_PUSH_PREFS);

  useEffect(() => {
    setLocal(readPrefs());
    const onChange = () => setLocal(readPrefs());
    prefsListeners.add(onChange);
    return () => {
      prefsListeners.delete(onChange);
    };
  }, []);

  const setPrefs = useCallback((updater: PushPrefs | ((p: PushPrefs) => PushPrefs)) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: PushPrefs) => PushPrefs)(readPrefs())
        : updater;
    writePrefs(next);
  }, []);

  return [prefs, setPrefs] as const;
}

/* ──────────────── Browser push (best-effort) ──────────────── */

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

async function tryDeliverPush(n: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const prefs = readPrefs();
  // Map the notification kind onto its preference key.
  const flag = prefs[n.kind as keyof PushPrefs];
  if (!flag) return;
  try {
    const native = new Notification(n.title, {
      body: n.body,
      icon: "/favicon.svg",
      tag: n.id,
    });
    if (n.href) {
      native.onclick = () => {
        window.focus();
        window.location.href = n.href!;
      };
    }
  } catch {
    // silently ignore — in-app notification still recorded
  }
}

/* ──────────────── Display helpers ──────────────── */

export const KIND_LABEL: Record<NotificationKind, string> = {
  thread_post: "新規投稿",
  thread_reply: "返信",
  reaction: "リアクション",
  system: "お知らせ",
  dm: "ダイレクト",
  chat_approved: "Chat 承認",
  chat_request: "Chat 申請",
  new_job: "新着求人",
  new_salary: "新着年収",
};

export const KIND_ICON: Record<NotificationKind, string> = {
  thread_post: "💬",
  thread_reply: "↩️",
  reaction: "👍",
  system: "🔔",
  dm: "✉️",
  chat_approved: "☕",
  chat_request: "📩",
  new_job: "💼",
  new_salary: "💴",
};

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}日前`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}週間前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
