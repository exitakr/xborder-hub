"use client";

import { useActionState, useState } from "react";
import type { getDict } from "@oma/core";
import { authErrorMessage } from "@/lib/auth-messages";
import { ResendConfirmation } from "@/components/ResendConfirmation";
import {
  resendConfirmation,
  sendMagicLink,
  signIn,
  signInWithGoogle,
  type AuthState,
} from "./actions";

type Dict = ReturnType<typeof getDict>;

export function LoginForm({ t, next }: { t: Dict; next: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signIn, {});
  const [magicState, magicAction, magicPending] = useActionState<AuthState, FormData>(
    sendMagicLink,
    {},
  );

  const state = mode === "password" ? pwState : magicState;

  return (
    <div className="space-y-4">
      {state.error && (
        <div role="alert" className="space-y-2 rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          <p>{authErrorMessage(t, state.error)}</p>
          {/* An unconfirmed account cannot be rescued by trying again — the
              only way out is another email, so offer one right here rather
              than sending the user back to signup, where signing up again
              would fail because the account already exists. */}
          {state.error === "unconfirmed" && (
            <ResendConfirmation t={t} email={state.email ?? ""} action={resendConfirmation} />
          )}
        </div>
      )}
      {magicState.notice === "magic" && (
        <p role="status" className="rounded-lg bg-gain/5 px-3 py-2 text-sm text-gain">
          {t.authMagicSent}
        </p>
      )}

      {mode === "password" ? (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="email">
              {t.authEmail}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t.authPassword}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="field"
            />
          </div>
          {/* The way back in. Without a link here, a forgotten password was a
              permanently lost account — the magic-link tab only helps someone
              who thinks to look for it. */}
          <p className="text-right">
            <a href="/forgot" className="rounded text-xs text-muted hover:text-ink hover:underline">
              {t.authForgot}
            </a>
          </p>

          <button type="submit" disabled={pwPending} className="btn-primary w-full">
            {pwPending ? t.loading : t.authSignIn}
          </button>
        </form>
      ) : (
        <form action={magicAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="magic-email">
              {t.authEmail}
            </label>
            <input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field"
            />
          </div>
          <button type="submit" disabled={magicPending} className="btn-primary w-full">
            {magicPending ? t.loading : t.authMagic}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="w-full rounded py-1 text-center text-sm text-accent hover:underline"
      >
        {mode === "password" ? t.authMagic : t.authSignIn}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn-secondary w-full">
          {t.authGoogle}
        </button>
      </form>
    </div>
  );
}
