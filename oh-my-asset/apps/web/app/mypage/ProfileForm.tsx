"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { getDict } from "@oma/core";
import { LOCALES, type Locale } from "@oma/core";
import { CURRENCIES, type Currency } from "@oma/core";
import { deleteAccount, saveProfile, type ProfileState } from "./actions";

const LOCALE_NAMES: Record<Locale, string> = { ja: "日本語", en: "English" };

export function ProfileForm({
  t,
  displayName,
  currency,
  locale,
}: {
  t: ReturnType<typeof getDict>;
  displayName: string;
  currency: Currency;
  locale: Locale;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});

  return (
    <form
      action={async (formData) => {
        await action(formData);
        router.refresh();
      }}
      className="card space-y-4 p-5"
    >
      {state.ok && (
        <p role="status" className="rounded-lg bg-gain/5 px-3 py-2 text-sm text-gain">
          {t.mySaved}
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {t.txErrGeneric}
        </p>
      )}

      <div>
        <label className="label" htmlFor="displayName">
          {t.myDisplayName}
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={60}
          defaultValue={displayName}
          className="field"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="baseCurrency">
            {t.myCurrency}
          </label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            defaultValue={currency}
            className="field"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="locale">
            {t.myLanguage}
          </label>
          <select id="locale" name="locale" defaultValue={locale} className="field">
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? t.loading : t.mySave}
      </button>
    </form>
  );
}

export function DeleteAccount({ t }: { t: ReturnType<typeof getDict> }) {
  const [confirm, setConfirm] = useState("");

  return (
    <form action={deleteAccount} className="card border-loss/30 p-5">
      <h2 className="text-sm font-semibold text-loss">{t.myDanger}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.myDangerBody}</p>

      <label className="label mt-4" htmlFor="confirm">
        {t.myDeleteConfirm}
      </label>
      <input
        id="confirm"
        name="confirm"
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="off"
        className="field max-w-xs"
      />

      <button type="submit" disabled={confirm !== "DELETE"} className="btn-danger mt-4">
        {t.myDeleteAccount}
      </button>
    </form>
  );
}
