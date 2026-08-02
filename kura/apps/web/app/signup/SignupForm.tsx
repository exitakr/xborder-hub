"use client";

import { useActionState } from "react";
import type { getDict } from "@kura/core";
import { signInWithGoogle, signUp, type AuthState } from "../login/actions";

export function SignupForm({ t }: { t: ReturnType<typeof getDict> }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

  if (state.notice === "confirm") {
    return (
      <p role="status" className="rounded-lg bg-gain/5 px-3 py-3 text-sm text-gain">
        {t.authMagicSent}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {t.txErrGeneric}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="displayName">
            {t.authDisplayName}
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            required
            maxLength={60}
            className="field"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            className="field"
          />
          <p id="password-hint" className="mt-1 text-xs text-muted">
            {t.authPasswordHint}
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? t.loading : t.authSignUp}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <button type="submit" className="btn-secondary w-full">
          {t.authGoogle}
        </button>
      </form>
    </div>
  );
}
