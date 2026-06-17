"use client";

import { useActionState } from "react";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";
import { updateVisibilitySettings, type UpdateState } from "./actions";

const INITIAL: UpdateState = {};

const ROWS: {
  key: keyof VisibilitySettings;
  label: string;
  hint: string;
  badge?: string;
}[] = [
  {
    key: "show_companies",
    label: "会社名を表示する",
    hint: "実際の会社名は表示せず「外資系 Big Tech」などのカテゴリに自動匿名化されます。",
  },
  {
    key: "show_salary",
    label: "給与レンジを表示する",
    hint: "正確な金額ではなくレンジ(例: SGD 8k–10k)だけが公開されます。",
  },
  {
    key: "show_skills",
    label: "スキルを表示する",
    hint: "選択したスキルタグ(SQL / Gen AI / 多国籍チーム経験 など)を公開します。",
  },
  {
    key: "show_visa",
    label: "VISA タイプを表示する",
    hint: "EP / S Pass / H1B などの種別だけが公開されます。発給日や個別情報は出ません。",
  },
  // Coffee Chat 受付トグルは「☕ Coffee Chat」セクション側で管理するため、
  // ここでは表示しない(重複防止)。
];

export function PrivacySettings({
  initial,
}: {
  initial?: VisibilitySettings;
}) {
  const values: VisibilitySettings = {
    ...DEFAULT_VISIBILITY_SETTINGS,
    ...(initial ?? {}),
  };

  const [state, action, pending] = useActionState(
    updateVisibilitySettings,
    INITIAL,
  );

  return (
    <section className="rise">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
          🔒 privacy
        </p>
        <h2 className="display font-bold text-[22px] mt-1 leading-tight text-ink">
          プライバシー設定
        </h2>
        <p className="text-[12px] text-ink-soft mt-2 leading-relaxed">
          公開範囲を細かく制御できます。すべてのデータは個人が特定できない形で
          統計・集計に使用されます。
        </p>
      </div>

      <form action={action} className="bg-cream border border-ink rounded-3xl p-4 lg:p-5 shadow-pop-sm space-y-3">
        {ROWS.map((row) => (
          <label
            key={row.key}
            className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-paper border border-ink/15 cursor-pointer hover:border-ink/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-[13px] text-ink">{row.label}</p>
                {row.badge && (
                  <span className="text-[9px] uppercase tracking-wider bg-ink text-mustard px-1.5 py-0.5 rounded font-bold">
                    {row.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
                {row.hint}
              </p>
            </div>
            <input
              type="checkbox"
              name={row.key}
              defaultChecked={values[row.key]}
              className="mt-1 w-5 h-5 accent-blue cursor-pointer flex-shrink-0"
            />
          </label>
        ))}

        {state.ok && (
          <p className="text-[12px] text-jade-deep font-bold">
            ✓ プライバシー設定を更新しました
          </p>
        )}
        {state.error && (
          <p className="text-[12px] text-plum font-bold leading-relaxed">
            ⚠ {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full disabled:opacity-60"
        >
          {pending ? "保存中…" : "プライバシー設定を保存"}
        </button>
      </form>
    </section>
  );
}
