"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import { requestPasswordReset, type ActionState } from "../actions";

const initial: ActionState = {};

export function ForgotForm({ initialError }: { initialError?: string } = {}) {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initial,
  );
  const error = state.error ?? initialError;

  return (
    <main className="container-narrow px-5 py-10 lg:py-16 relative z-10 min-h-screen flex flex-col">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 self-start mb-8"
      >
        <LogoMark />
        <div>
          <div className="display font-bold text-[15px] leading-none tracking-tight text-ink">
            X Border Hub
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
            Global Career Path
          </div>
        </div>
      </Link>

      <div className="auth-card flex-1">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-blue font-bold mb-2">
            FORGOT PASSWORD
          </p>
          <h1 className="display font-bold text-[26px] lg:text-[32px] leading-tight text-ink">
            パスワードを
            <br />
            <span className="serif-it text-[30px] lg:text-[36px] u-blue">
              再設定する
            </span>
          </h1>
          <p className="text-[13px] text-ink-soft mt-3 leading-relaxed">
            登録時のメールアドレスを入力してください。再設定用のリンクをメールで送ります。
          </p>
        </div>

        {state.ok && state.message && (
          <div className="mb-4 bg-jade/20 border border-jade/40 rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            ✓ {state.message}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-paper border border-ink/15 rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            ⚠ {error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending ? "送信中…" : "再設定リンクを送る"}
          </button>
        </form>

        <p className="text-[12px] text-ink-soft mt-5 text-center">
          <Link
            href="/login"
            className="text-blue font-bold underline underline-offset-2"
          >
            ← ログインに戻る
          </Link>
        </p>

        <details className="mt-6 bg-paper border border-ink/10 rounded-xl p-3">
          <summary className="text-[11px] font-bold text-ink cursor-pointer">
            メールが届かないとき
          </summary>
          <ul className="text-[11px] text-ink-soft mt-2 space-y-1 list-disc pl-4 leading-relaxed">
            <li>迷惑メール / プロモーション / ゴミ箱フォルダを確認</li>
            <li>数分待ってから再送(連続送信は rate limit に当たります)</li>
            <li>
              そのメアドで登録していない場合はメールは送られません。新規登録から始めてください。
            </li>
          </ul>
        </details>
      </div>

      <p className="serif-it text-[14px] text-ink-faint mt-10 text-center">
        crossing borders, one career at a time.
      </p>
    </main>
  );
}
