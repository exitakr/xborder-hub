"use client";

import { useState } from "react";

export function ConsultApply({
  name = "ユーザー",
  initialsText = "—",
}: {
  name?: string;
  initialsText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function submit() {
    if (!message.trim()) {
      alert("話を聞きたい内容を入力してください");
      return;
    }
    setOpen(false);
    setMessage("");
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  return (
    <>
      {/* Sticky CTA */}
      <div className="fixed bottom-20 lg:bottom-8 left-0 right-0 z-30 px-5 pointer-events-none">
        <div className="container-app pointer-events-auto">
          <div className="max-w-2xl mx-auto bg-ink text-cream rounded-2xl p-3 flex items-center justify-between gap-3 shadow-pop-blue">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-mustard font-bold">
                ☕ Coffee Chat
              </p>
              <p className="display font-bold text-[15px] text-cream">
                SGD 30 · 20分
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-5 py-2.5 bg-mustard text-ink rounded-full font-bold text-[13px]"
            >
              話を聞く →
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`modal-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <div className={`modal-sheet ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="px-5 pt-2">
          <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-faint font-bold">
                Coffee Chat申請
              </p>
              <h3 className="display font-bold text-[20px] text-ink mt-1">
                話を聞きたい
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-paper border border-ink flex items-center justify-center text-ink"
              aria-label="閉じる"
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

          <div className="bg-paper border border-ink/15 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue text-cream font-bold flex items-center justify-center text-sm border border-ink/20 flex-shrink-0">
              {initialsText}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[14px] text-ink">{name}</p>
              <p className="text-[11px] text-ink-soft">
                Tokyo → Singapore · SGD 30/20分
              </p>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <div>
              <label className="label" htmlFor="app-message">
                話を聞きたい内容 *
              </label>
              <textarea
                id="app-message"
                className="field"
                rows={5}
                placeholder="例: SG現地Tech企業への転職活動の進め方について、面接対策と給与交渉のコツを伺いたいです。"
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-[10px] text-ink-faint mt-1 text-right">
                {message.length} / 500
              </p>
            </div>

            <div>
              <label className="label" htmlFor="app-when">
                希望日時(任意)
              </label>
              <input
                id="app-when"
                type="text"
                className="field"
                placeholder="例: 平日夜 / 週末午後"
              />
            </div>

            <div className="bg-paper border border-ink rounded-xl p-3">
              <p className="text-[11px] font-bold text-ink mb-1">📌 申請の流れ</p>
              <ol className="text-[11px] text-ink-soft space-y-0.5 pl-4 list-decimal">
                <li>{name}が内容を確認</li>
                <li>承認されたらトークルームが開きます</li>
                <li>日時を決めて実施</li>
              </ol>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            className="btn-primary w-full mb-4"
          >
            申請を送る
            <svg
              width="14"
              height="14"
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

      {/* Toast */}
      <div
        className="fixed bottom-32 lg:bottom-20 left-1/2 -translate-x-1/2 z-50 bg-jade-deep text-cream rounded-full px-5 py-3 shadow-pop-lg border border-ink font-bold text-[13px] pointer-events-none transition-opacity duration-300"
        style={{ opacity: toastVisible ? 1 : 0 }}
      >
        ✓ 申請を送りました
      </div>
    </>
  );
}
