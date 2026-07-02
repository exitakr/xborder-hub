"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { createThreadAction } from "./actions";

type Country = "" | "sg" | "jp" | "hk" | "vn" | "th" | "us" | "other";
type Industry = "" | "tech" | "finance" | "startup" | "consumer" | "manufacturing" | "other";
type Role = "" | "pm" | "eng" | "bd" | "marketing" | "design" | "other";
type Category =
  | ""
  | "career"
  | "life"
  | "visa"
  | "salary"
  | "family"
  | "other";

const COUNTRIES: { v: Country; label: string }[] = [
  { v: "sg", label: "🇸🇬 Singapore" },
  { v: "jp", label: "🇯🇵 Japan" },
  { v: "hk", label: "🇭🇰 Hong Kong" },
  { v: "vn", label: "🇻🇳 Vietnam" },
  { v: "th", label: "🇹🇭 Thailand" },
  { v: "us", label: "🇺🇸 United States" },
  { v: "other", label: "🌏 その他" },
];

const INDUSTRIES: { v: Industry; label: string }[] = [
  { v: "tech", label: "💻 Tech" },
  { v: "finance", label: "🏦 Finance" },
  { v: "startup", label: "🚀 Startup" },
  { v: "consumer", label: "🛍 Consumer" },
  { v: "manufacturing", label: "🏭 Manufacturing" },
  { v: "other", label: "🏢 その他" },
];

const ROLES: { v: Role; label: string }[] = [
  { v: "pm", label: "📐 PM" },
  { v: "eng", label: "⚙️ Engineer" },
  { v: "bd", label: "💼 BD / Sales" },
  { v: "marketing", label: "📣 Marketing" },
  { v: "design", label: "🎨 Design" },
  { v: "other", label: "👤 その他" },
];

const CATEGORIES: { v: Category; label: string }[] = [
  { v: "career", label: "💼 キャリア" },
  { v: "life", label: "🏠 生活" },
  { v: "visa", label: "🛂 ビザ" },
  { v: "salary", label: "💰 給与" },
  { v: "family", label: "👨‍👩‍👧 家族" },
  { v: "other", label: "💬 その他" },
];

export function ThreadNewClient({
  initialTitle = "",
  initialCategory = "",
}: {
  initialTitle?: string;
  initialCategory?: string;
} = {}) {
  const router = useRouter();
  const [country, setCountry] = useState<Country>("");
  const [industry, setIndustry] = useState<Industry>("");
  const [role, setRole] = useState<Role>("");
  const [category, setCategory] = useState<Category>(
    initialCategory as Category,
  );
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const valid = useMemo(
    () =>
      Boolean(category) && title.trim().length >= 5 && body.trim().length >= 10,
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
    if (!valid || pending) return;
    setError(null);
    startTransition(async () => {
      const sanitize = (v: string) =>
        v && v !== "other" ? v : null;
      const res = await createThreadAction({
        country: sanitize(country),
        industry: sanitize(industry),
        role: sanitize(role),
        category: category as string,
        title: title.trim(),
        body: body.trim(),
      });
      if (res.ok) {
        track("thread_post", { category, country: country || null });
        router.push(`/thread?id=${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream border-b-[1.5px] border-ink">
        <div className="container-app py-2.5 flex items-center justify-between gap-3">
          <Link
            href="/threads"
            className="w-9 h-9 rounded-full bg-cream border border-ink/15 flex items-center justify-center text-ink flex-shrink-0"
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
            disabled={!valid || pending}
            className={`px-4 py-2 rounded-full font-bold text-[12px] flex-shrink-0 transition-all ${
              valid && !pending ? "bg-blue text-cream" : "bg-ink/20 text-ink/40"
            }`}
          >
            {pending ? "投稿中…" : "投稿"}
          </button>
        </div>
      </header>

      <main className="container-app pt-5 pb-32 lg:pb-20">
        <div className="max-w-2xl mx-auto compose-shell">
          {/* Tagging: country / industry / role / category */}
          <section className="mb-6 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                🌏 国 <span className="font-normal">(任意)</span>
              </p>
              <ChipRow
                options={COUNTRIES}
                value={country}
                onChange={(v) => setCountry(v as Country)}
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                🏢 業界 <span className="font-normal">(任意)</span>
              </p>
              <ChipRow
                options={INDUSTRIES}
                value={industry}
                onChange={(v) => setIndustry(v as Industry)}
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                👤 職種 <span className="font-normal">(任意)</span>
              </p>
              <ChipRow
                options={ROLES}
                value={role}
                onChange={(v) => setRole(v as Role)}
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-2">
                💡 カテゴリ <span className="text-blue">*</span>
              </p>
              <ChipRow
                options={CATEGORIES}
                value={category}
                onChange={(v) => setCategory(v as Category)}
              />
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
              <p className="text-[10px] text-ink-faint">{body.length} / 2000</p>
            </div>
          </section>

          <section className="mt-6">
            <div className="bg-paper border border-ink rounded-2xl p-4">
              <p className="text-[12px] font-bold text-ink mb-2">📌 投稿のヒント</p>
              <ul className="text-[11px] text-ink-soft space-y-1 pl-4 list-disc leading-relaxed">
                <li>個人情報・会社の機密は書かないでください</li>
                <li>国・業界・職種を指定すると、同じ条件で探している人に見つけてもらいやすくなります</li>
                <li>誹謗中傷・差別的な内容は禁止です</li>
                <li>匿名で投稿されます(自分の名前は表示されません)</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t-[1.5px] border-ink">
        {error && (
          <div className="container-app pt-2">
            <p className="text-[11px] font-bold text-red-600">{error}</p>
          </div>
        )}
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
            disabled={!valid || pending}
            className={`flex-1 max-w-xs btn-primary ${valid && !pending ? "" : "opacity-40 cursor-not-allowed"}`}
          >
            {pending ? "投稿中…" : "投稿する"}
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

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T | "";
  onChange: (v: T | "") => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(active ? ("" as T) : o.v)}
            className={`px-2.5 py-1 border border-ink rounded-full text-[11px] font-bold transition-colors ${
              active ? "bg-ink text-cream" : "bg-cream text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
