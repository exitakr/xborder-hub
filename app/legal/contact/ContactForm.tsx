"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

const INITIAL: ContactState = {};

export function ContactForm({
  initialEmail = "",
  initialName = "",
}: {
  initialEmail?: string;
  initialName?: string;
}) {
  const [state, action, pending] = useActionState(submitContact, INITIAL);

  if (state.ok) {
    return (
      <div className="bg-jade/15 border border-jade rounded-2xl p-5">
        <p className="display font-bold text-[16px] text-ink mb-1">
          ✓ 送信しました
        </p>
        <p className="text-[12px] text-ink-soft leading-relaxed">
          内容を確認のうえ、通常 1〜3 営業日以内にご返信します。
          急ぎの場合は件名に「至急」とご記載ください。
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {/* Honeypot — hidden from humans, bots fill everything */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />

      <div>
        <label className="label" htmlFor="contact-category">
          お問い合わせ種別
        </label>
        <select
          id="contact-category"
          name="category"
          defaultValue="general"
          className="filter-select"
        >
          <option value="general">一般的なご質問・ご要望</option>
          <option value="account">アカウント削除・データ修正</option>
          <option value="report">不適切な投稿の通報</option>
          <option value="bug">不具合の報告</option>
          <option value="business">取材・協業のご相談</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="contact-name">
            お名前(任意)
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            className="field"
            defaultValue={initialName}
            maxLength={100}
            placeholder="例: 山田太郎"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            返信先メールアドレス *
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="field"
            defaultValue={initialEmail}
            maxLength={254}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact-subject">
          件名 *
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          className="field"
          maxLength={200}
          placeholder="例: アカウント削除希望"
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-body">
          お問い合わせ内容 *
        </label>
        <textarea
          id="contact-body"
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={8}
          className="field"
          placeholder="できるだけ具体的に記載いただけると、スムーズに対応できます。"
        />
        <p className="text-[10px] text-ink-faint mt-1">10〜4000 文字</p>
      </div>

      {state.error && (
        <div className="bg-paper border border-ink rounded-xl p-3 text-[12px] text-ink leading-relaxed">
          ⚠ {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full disabled:opacity-50"
      >
        {pending ? "送信中…" : "送信する"}
      </button>

      <p className="text-[10px] text-ink-faint leading-relaxed">
        送信内容は運営者のみが閲覧します。返信メールが届かない場合は
        迷惑メールフォルダもご確認ください。
      </p>
    </form>
  );
}
