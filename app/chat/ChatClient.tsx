"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage } from "@/lib/chat/actions";

/* ─────────── Demo fallback (legacy ?with= walkthrough) ─────────── */

function partnerNameFromParam(raw: string | null): {
  display: string;
  initials: string;
} {
  if (!raw) return { display: "HK さん", initials: "HK" };
  const cleaned = raw.replace(/(さん|くん|さま|様)\s*$/, "").trim();
  if (!cleaned) return { display: "HK さん", initials: "HK" };
  const initials = cleaned.substring(0, 3).toUpperCase();
  return { display: `${cleaned} さん`, initials };
}

const DEMO_SEED: { from: "me" | "other"; text: string }[] = [
  {
    from: "other",
    text: "こんにちは!Coffee Chatのご申請ありがとうございます ☕",
  },
  {
    from: "other",
    text: "事前に聞きたいトピックを共有いただけると、当日の時間を有効に使えると思います!",
  },
];

/* ─────────── Shared message shape ─────────── */

export type ChatMessageView = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

function initialsOf(name: string): string {
  const cleaned = name.replace(/(さん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  }
  return Array.from(cleaned).slice(0, 2).join("");
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ChatClient({
  roomId,
  currentUserId,
  partnerName,
  initialMessages = [],
  demoWith,
}: {
  roomId?: string;
  currentUserId: string;
  partnerName?: string;
  initialMessages?: ChatMessageView[];
  /** Legacy demo mode: renders the scripted walkthrough conversation. */
  demoWith?: string;
}) {
  const isDemo = !roomId;
  const demoPartner = partnerNameFromParam(demoWith ?? null);
  const displayName = isDemo
    ? demoPartner.display
    : `${partnerName ?? "メンバー"} さん`;
  const avatarInitials = isDemo
    ? demoPartner.initials
    : initialsOf(partnerName ?? "");

  const [messages, setMessages] = useState<ChatMessageView[]>(
    isDemo
      ? DEMO_SEED.map((m, i) => ({
          id: `demo-${i}`,
          senderId: m.from === "me" ? currentUserId : "demo-partner",
          body: m.text,
          createdAt: new Date().toISOString(),
        }))
      : initialMessages,
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Realtime: receive partner messages instantly (best-effort — if the
  // publication isn't enabled the chat still works via send-echo).
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`room-${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (cancelled) return;
            const row = payload.new as {
              id: string;
              sender_id: string;
              body: string;
              created_at: string;
            };
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: row.id,
                      senderId: row.sender_id,
                      body: row.body,
                      createdAt: row.created_at,
                    },
                  ],
            );
          },
        )
        .subscribe();
      return () => {
        cancelled = true;
        void supabase.removeChannel(channel);
      };
    } catch {
      // Missing env vars — silently skip realtime.
      return;
    }
  }, [roomId]);

  useEffect(() => {
    if (areaRef.current) {
      areaRef.current.scrollTop = areaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    if (isDemo) {
      setMessages((m) => [
        ...m,
        {
          id: `demo-${Date.now()}`,
          senderId: currentUserId,
          body: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setInput("");
      return;
    }

    setSending(true);
    setError(null);
    const res = await sendChatMessage({ roomId: roomId!, body: text });
    setSending(false);
    if (res.ok) {
      setMessages((prev) =>
        prev.some((m) => m.id === res.id)
          ? prev
          : [
              ...prev,
              {
                id: res.id,
                senderId: currentUserId,
                body: text,
                createdAt: res.createdAt,
              },
            ],
      );
      setInput("");
    } else {
      setError(res.error);
    }
  }

  // Build render list with day dividers.
  const rendered: (
    | { kind: "day"; key: string; label: string }
    | { kind: "msg"; key: string; mine: boolean; body: string }
  )[] = [];
  let lastDay = "";
  for (const m of messages) {
    const day = dayLabel(m.createdAt);
    if (day !== lastDay) {
      rendered.push({ kind: "day", key: `day-${day}-${m.id}`, label: day });
      lastDay = day;
    }
    rendered.push({
      kind: "msg",
      key: m.id,
      mine: m.senderId === currentUserId,
      body: m.body,
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b-[1.5px] border-ink">
        <div className="container-app py-2.5 flex items-center justify-between gap-3">
          <Link
            href={isDemo ? "/mypage" : "/chat"}
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
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-sm border border-ink/15 flex-shrink-0">
              {avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="display font-bold text-[14px] tracking-tight text-ink truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-ink-soft truncate">
                Coffee Chat
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="status-badge status-approved">✓ 承認</span>
          </div>
        </div>
      </header>

      <main className="container-app">
        <div className="chat-shell">
          {/* Chat area */}
          <div className="chat-area" ref={areaRef}>
            {rendered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">👋</p>
                <p className="text-[12px] text-ink-soft">
                  最初のメッセージを送って、Coffee Chat の日程を決めましょう。
                </p>
              </div>
            )}
            {rendered.map((r) =>
              r.kind === "day" ? (
                <div key={r.key} className="day-divider">
                  {r.label}
                </div>
              ) : r.mine ? (
                <div key={r.key} className="chat-row me">
                  <div className="chat-bubble chat-me">{r.body}</div>
                </div>
              ) : (
                <div key={r.key} className="chat-row other">
                  <div className="w-7 h-7 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-[10px] border border-ink/15 flex-shrink-0">
                    {avatarInitials}
                  </div>
                  <div className="chat-bubble chat-other">{r.body}</div>
                </div>
              ),
            )}
          </div>

          {/* Input */}
          {error && (
            <p className="text-[11px] font-bold text-red-600 px-4 pt-2">
              {error}
            </p>
          )}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              className="chat-input"
              rows={1}
              placeholder="メッセージを入力..."
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending}
              className="chat-send disabled:opacity-50"
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
      </main>
    </>
  );
}
