"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/components/site/AppTopBar";
import {
  approveCommunityRequest,
  rejectCommunityRequest,
} from "@/lib/admin/actions";
import type { AdminStats } from "@/lib/admin/queries";
import type { CommunityKind } from "@/lib/supabase/database.types";

type RequestItem = {
  id: string;
  kind: CommunityKind;
  name: string;
  description: string | null;
  status: string;
  requesterName: string;
  createdAt: string;
};

type CommunityItem = {
  id: string;
  kind: CommunityKind;
  label: string;
  active: boolean;
  membersCount: number;
};

const KIND_LABEL: Record<CommunityKind, string> = {
  country: "🌏 国",
  industry: "🏢 業界",
  role: "👤 職種",
};

export function AdminClient({
  requests,
  communities,
  stats,
}: {
  requests: RequestItem[];
  communities: CommunityItem[];
  stats: AdminStats;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  function act(
    id: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      setBusy(null);
      if (!res.ok) {
        setError(("error" in res && res.error) || "操作に失敗しました");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <AppTopBar />

      <main className="container-app py-5 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <section>
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
              🛠 admin console
            </p>
            <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
              管理コンソール
            </h1>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ["会員", stats.members],
                ["スレッド", stats.threads],
                ["コメント", stats.comments],
                ["Coffee Chat", stats.coffeeChats],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="bg-paper border border-ink rounded-2xl p-3 text-center shadow-pop-sm"
              >
                <p className="display font-bold text-[22px] text-ink">
                  {value ?? "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-faint font-bold">
                  {label}
                </p>
              </div>
            ))}
          </section>

          {error && (
            <p className="text-[12px] font-bold text-red-600">{error}</p>
          )}

          {/* Pending community requests */}
          <section>
            <h2 className="display font-bold text-[17px] text-ink mb-3">
              コミュニティ申請(未対応 {pending.length} 件)
            </h2>
            {pending.length === 0 ? (
              <p className="text-[12px] text-ink-faint">
                未対応の申請はありません。
              </p>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="bg-cream border border-ink rounded-2xl p-4 shadow-pop-sm"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-bold text-[14px] text-ink">
                        {KIND_LABEL[r.kind]} · {r.name}
                      </p>
                      <p className="text-[10px] text-ink-faint whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink-soft mb-1">
                      申請者: {r.requesterName}
                    </p>
                    {r.description && (
                      <p className="text-[12px] text-ink-soft leading-relaxed border-t border-dashed border-ink/20 pt-2 mt-2">
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-ink/20">
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() =>
                          act(r.id, () =>
                            rejectCommunityRequest({ requestId: r.id }),
                          )
                        }
                        className="px-3 py-1.5 bg-cream border border-ink/15 text-ink rounded-full font-bold text-[11px] disabled:opacity-50"
                      >
                        却下
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() =>
                          act(r.id, () =>
                            approveCommunityRequest({
                              requestId: r.id,
                              kind: r.kind,
                              name: r.name,
                              description: r.description,
                            }),
                          )
                        }
                        className="px-3 py-1.5 bg-jade-deep text-cream rounded-full font-bold text-[11px] disabled:opacity-50"
                      >
                        ✓ 承認して開設
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Communities */}
          <section>
            <h2 className="display font-bold text-[17px] text-ink mb-3">
              コミュニティ ({communities.length})
            </h2>
            {communities.length === 0 ? (
              <p className="text-[12px] text-ink-faint">
                コミュニティがまだありません(マイグレーション 0002 のシードで
                11 件作成されます)。
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {communities.map((c) => (
                  <div
                    key={c.id}
                    className="bg-cream border border-ink/20 rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[12px] text-ink truncate">
                        {c.label}
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        {KIND_LABEL[c.kind]} · {c.membersCount} 人
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.active
                          ? "bg-jade text-ink"
                          : "bg-ink/10 text-ink-faint"
                      }`}
                    >
                      {c.active ? "公開中" : "停止中"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviewed history */}
          {reviewed.length > 0 && (
            <section>
              <h2 className="display font-bold text-[17px] text-ink mb-3">
                対応済みの申請
              </h2>
              <div className="space-y-1.5">
                {reviewed.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 bg-cream border border-ink/10 rounded-xl px-3 py-2"
                  >
                    <p className="text-[12px] text-ink truncate">
                      {KIND_LABEL[r.kind]} · {r.name}
                    </p>
                    <span
                      className={`status-badge ${
                        r.status === "approved"
                          ? "status-approved"
                          : "status-rejected"
                      }`}
                    >
                      {r.status === "approved" ? "✓ 承認" : "却下"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-[11px] text-ink-faint leading-relaxed">
            ※ このページは profiles.is_admin = true のアカウントのみ表示されます。
            管理者の追加は Supabase SQL Editor で
            <code className="bg-paper px-1 rounded">
              update profiles set is_admin = true where id = ...
            </code>
            を実行してください。
          </p>
        </div>
      </main>
    </>
  );
}
