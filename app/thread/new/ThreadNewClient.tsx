"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = "career" | "life" | "visa" | "salary" | "family" | "other";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "career", label: "💼 キャリア" },
  { id: "life", label: "🏠 生活" },
  { id: "visa", label: "🛂 ビザ" },
  { id: "salary", label: "💰 給与" },
  { id: "family", label: "👨‍👩‍👧 家族" },
  { id: "other", label: "💬 その他" },
];

export function ThreadNewClient() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const valid = useMemo(
    () => Boolean(category) && title.trim().length >= 5 && body.trim().length >= 10,
    [category, title, body],
  );

  const step = useMemo(() => {
    if (!category) return 1;
    if (title.trim().length < 5) return 2;
    return 3;
  }, [category, title]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  function submit() {
    if (!valid) return;
    alert("投稿しました!(デモ版)\nスレッド一覧に戻ります");
    router.push("/threads");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream border-b-[1.5px] border-ink">
        <div className="container-app py-2.5 flex items-center justify-between gap-3">
          <Link
            href="/threads"
            className="w-9 h-9 rounded-full bg-cream border-[1.5px] border-ink/15 flex items-center justify-center text-ink flex-shrink-0"
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
          </Link>
          <div className="text-center flex-1 min-w-0">
            <div className="display font-bold text-[14px] tracking-tight text-ink">
              新しいスレッド
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
              STEP {step} / 3
            </div>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className={`px-4 py-2 rounded-full font-bold text-[12px] flex-shrink-0 transition-all ${
              valid ? "bg-blue text-cream" : "bg-ink/20 text-ink/40"
            }`}
          >
            投稿
          </button>
        </div>
      </header>

      <main className="container-app pt-5 pb-32 lg:pb-20">
        <div className="max-w-2xl mx-auto compose-shell">
          {/* Category */}
          <section className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-3">
              カテゴリ <span className="text-blue">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-2 border-[1.5px] border-ink rounded-full text-[12px] font-bold shadow-pop-sm transition-colors ${
                      active ? "bg-ink text-cream" : "bg-cream text-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-ink/10 my-6" />

          {/* Title */}
          <section className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
              タイトル <span className="text-blue">*</span>
            </p>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="compose-title"
              rows={2}
              placeholder="質問・話題を一文で..."
              maxLength={80}
              style={{ fontSize: 22 }}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-ink-faint">
                具体的に書くと回答が集まりやすい
              </p>
              <p className="text-[10px] text-ink-faint">{title.length} / 80</p>
            </div>
          </section>

          <div className="h-px bg-ink/10 my-6" />

          {/* Body */}
          <section className="mb-6 flex-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
              内容 <span className="text-blue">*</span>
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="compose-body"
              placeholder="状況、聞きたいこと、相談したいことを自由に書いてください。匿名で投稿されます。"
              maxLength={2000}
            />
            <div className="flex items-center justify-end mt-2">
              <p className="text-[10px] text-ink-faint">
                {body.length} / 2000
              </p>
            </div>
          </section>

          {/* Tips */}
          <section className="mt-6">
            <div className="bg-paper border-[1.5px] border-ink rounded-2xl p-4">
              <p className="text-[12px] font-bold text-ink mb-2">
                📌 投稿のヒント
              </p>
              <ul className="text-[11px] text-ink-soft space-y-1 pl-4 list-disc leading-relaxed">
                <li>個人情報・会社の機密は書かないでください</li>
                <li>具体的な状況・国・時期を書くと回答が集まりやすい</li>
                <li>誹謗中傷・差別的な内容は禁止です</li>
                <li>匿名で投稿されます(自分の名前は表示されません)</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t-[1.5px] border-ink">
        <div className="container-app py-3 flex items-center justify-between gap-3">
          <Link
            href="/threads"
            className="px-4 py-2.5 text-[12px] font-bold text-ink-soft"
          >
            キャンセル
          </Link>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className={`flex-1 max-w-xs btn-primary ${valid ? "" : "opacity-40 cursor-not-allowed"}`}
          >
            投稿する
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
    </>
  );
}
