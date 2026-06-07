"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import { updatePassword, type ActionState } from "@/app/login/actions";

const initial: ActionState = {};

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

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
            SET NEW PASSWORD
          </p>
          <h1 className="display font-bold text-[26px] lg:text-[32px] leading-tight text-ink">
            新しいパスワードを
            <br />
            <span className="serif-it text-[30px] lg:text-[36px] u-blue">
              設定する
            </span>
          </h1>
          <p className="text-[13px] text-ink-soft mt-3 leading-relaxed">
            8 文字以上のパスワードを設定してください。設定後は自動的にログインします。
          </p>
        </div>

        {state.error && (
          <div className="mb-4 bg-paper border border-ink/15 rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            ⚠ {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">
              新しいパスワード <span className="text-ink-faint font-normal">(8 文字以上)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm">
              もう一度入力
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending ? "更新中…" : "パスワードを更新"}
          </button>
        </form>
      </div>

      <p className="serif-it text-[14px] text-ink-faint mt-10 text-center">
        crossing borders, one career at a time.
      </p>
    </main>
  );
}
