"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/LogoMark";
import {
  signInWithPassword,
  signUpWithPassword,
  sendMagicLink,
  type ActionState,
} from "./actions";

type Mode = "signin" | "signup" | "magic";

const initial: ActionState = {};

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");

  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPassword,
    initial,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPassword,
    initial,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLink,
    initial,
  );

  const state =
    mode === "signin"
      ? signInState
      : mode === "signup"
        ? signUpState
        : magicState;
  const pending =
    mode === "signin" ? signInPending : mode === "signup" ? signUpPending : magicPending;

  const action =
    mode === "signin"
      ? signInAction
      : mode === "signup"
        ? signUpAction
        : magicAction;

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
            crossing borders
          </div>
        </div>
      </Link>

      <div className="auth-card flex-1">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-blue font-bold mb-2">
            {mode === "signup" ? "JOIN" : "WELCOME BACK"}
          </p>
          <h1 className="display font-bold text-[26px] lg:text-[32px] leading-tight text-ink">
            {mode === "signup" ? (
              <>
                次の一歩、
                <br />
                <span className="serif-it text-[30px] lg:text-[36px] u-blue">
                  ここから始める
                </span>
              </>
            ) : (
              <>
                おかえり、
                <br />
                <span className="serif-it text-[30px] lg:text-[36px] u-blue">
                  軌跡を残そう
                </span>
              </>
            )}
          </h1>
        </div>

        {/* Mode tabs */}
        <div className="inline-flex gap-1 p-1 bg-cream border-[1.5px] border-ink rounded-xl mb-5 shadow-pop-sm">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === "signin" ? "bg-ink text-cream" : "text-ink-soft"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === "signup" ? "bg-ink text-cream" : "text-ink-soft"
            }`}
          >
            新規登録
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === "magic" ? "bg-ink text-cream" : "text-ink-soft"
            }`}
          >
            ✉️ Magic Link
          </button>
        </div>

        {state.ok && state.message && (
          <div className="mb-4 bg-jade/20 border-[1.5px] border-jade rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            ✓ {state.message}
          </div>
        )}
        {(state.error || initialError) && (
          <div className="mb-4 bg-paper border-[1.5px] border-ink rounded-xl p-3 text-[12px] text-ink leading-relaxed">
            ⚠ {state.error ?? initialError}
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />

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

          {mode !== "magic" && (
            <div>
              <label className="label" htmlFor="password">
                パスワード
                {mode === "signup" && (
                  <span className="text-ink-faint font-normal">
                    {" "}
                    (8 文字以上)
                  </span>
                )}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="field"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending
              ? "送信中…"
              : mode === "signup"
                ? "アカウントを作成"
                : mode === "magic"
                  ? "Magic Link を送る"
                  : "ログイン"}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <p className="text-[11px] text-ink-faint mt-5 leading-relaxed">
          続行することで、X Border Hub の
          <span className="text-ink font-bold underline-offset-2">利用規約</span>
          と
          <span className="text-ink font-bold underline-offset-2">
            プライバシーポリシー
          </span>
          に同意したものとみなされます。
        </p>
      </div>

      <p className="serif-it text-[14px] text-ink-faint mt-10 text-center">
        crossing borders, one career at a time.
      </p>
    </main>
  );
}
