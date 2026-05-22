"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message =
  | { kind: "day"; label: string }
  | { kind: "msg"; from: "me" | "other"; text: string };

const SEED: Message[] = [
  { kind: "day", label: "2026年5月13日" },
  {
    kind: "msg",
    from: "other",
    text: "こんにちは!Coffee Chatのご申請ありがとうございます ☕",
  },
  {
    kind: "msg",
    from: "other",
    text: "商社からVN起業までの道のり、家族同行の現実、何でも聞いてください。事前に聞きたいトピックを共有いただけると、当日の時間を有効に使えると思います!",
  },
  {
    kind: "msg",
    from: "me",
    text: "ご連絡ありがとうございます!特に気になっているのは、起業初期の資金繰りと、家族(妻+子2人)を連れての生活立ち上げです。",
  },
  {
    kind: "msg",
    from: "me",
    text: "当日はZoomでお願いできますか?",
  },
  {
    kind: "msg",
    from: "other",
    text: "もちろん!当日 14:00 にZoomリンクをこちらにお送りします。事前にこちらの記事(過去の起業体験談)に目を通しておくと話がスムーズかもしれません 🚀",
  },
  { kind: "day", label: "2026年5月16日" },
  {
    kind: "msg",
    from: "me",
    text: '記事拝読しました!特に "現地パートナー探しの3つの基準" が刺さりました。当日深く聞かせてください。',
  },
];

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [input, setInput] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { kind: "msg", from: "me", text }]);
    setInput("");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b-[1.5px] border-ink">
        <div className="container-app py-2.5 flex items-center justify-between gap-3">
          <Link
            href="/mypage"
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
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-sm border-[1.5px] border-ink flex-shrink-0">
              HK
            </div>
            <div className="min-w-0">
              <div className="display font-bold text-[14px] tracking-tight text-ink truncate">
                HK さん
              </div>
              <div className="text-[10px] text-ink-soft truncate">
                TYO→SIN→SGN · 起業家
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
          {/* Booking banner */}
          <div className="bg-paper border-b border-ink/20 px-4 py-2.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-ink-soft font-bold">
              <span>📅</span>
              <span>2026/05/18 14:00 · SGD 80 · 30min</span>
            </div>
            <button type="button" className="text-blue font-bold">
              詳細
            </button>
          </div>

          {/* Chat area */}
          <div className="chat-area" ref={areaRef}>
            {messages.map((m, i) =>
              m.kind === "day" ? (
                <div key={i} className="day-divider">
                  {m.label}
                </div>
              ) : m.from === "other" ? (
                <div key={i} className="chat-row other">
                  <div className="w-7 h-7 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-[10px] border-[1.5px] border-ink flex-shrink-0">
                    HK
                  </div>
                  <div className="chat-bubble chat-other">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="chat-row me">
                  <div className="chat-bubble chat-me">{m.text}</div>
                </div>
              ),
            )}
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="chat-input"
              rows={1}
              placeholder="メッセージを入力..."
            />
            <button
              type="button"
              onClick={send}
              className="chat-send"
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
