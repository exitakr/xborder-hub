"use client";

import { useActionState, useState } from "react";
import type { getDict } from "@/lib/i18n/dict";
import { sendMagicLink, signIn, signInWithGoogle, type AuthState } from "./actions";

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
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {t.txErrGeneric}
        </p>
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
