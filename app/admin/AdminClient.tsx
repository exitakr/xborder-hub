"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import {
  adminDeleteComment,
  adminDeleteThread,
  adminExportCompData,
  approveCommunityRequest,
  rejectCommunityRequest,
  updateContactStatus,
} from "@/lib/admin/actions";
import type {
  AdminComment,
  AdminMember,
  AdminStats,
  AdminThread,
  ContactSubmission,
  DailyMetric,
} from "@/lib/admin/queries";
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

type TabId =
  | "overview"
  | "kpi"
  | "members"
  | "content"
  | "contact"
  | "communities";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "kpi", label: "KPI" },
  { id: "members", label: "会員" },
  { id: "content", label: "コンテンツ" },
  { id: "contact", label: "お問い合わせ" },
  { id: "communities", label: "コミュニティ" },
];

/** Metric definitions for the KPI small multiples — fixed hue per entity. */
const KPI_SERIES: { key: keyof Omit<DailyMetric, "day">; label: string; color: string }[] = [
  { key: "signups", label: "新規登録", color: "#0055A4" },
  { key: "comp_posts", label: "年収データ投稿", color: "#1FA89E" },
  { key: "threads", label: "スレッド投稿", color: "#6B4F8E" },
  { key: "comments", label: "コメント", color: "#E89943" },
  { key: "cc_requests", label: "Coffee Chat 申請", color: "#0055A4" },
];

function KpiChart({
  metrics,
  seriesKey,
  label,
  color,
}: {
  metrics: DailyMetric[];
  seriesKey: keyof Omit<DailyMetric, "day">;
  label: string;
  color: string;
}) {
  const values = metrics.map((m) => Number(m[seriesKey] ?? 0));
  const max = Math.max(...values, 1);
  const total7 = values.slice(-7).reduce((a, b) => a + b, 0);
  const prev7 = values.slice(-14, -7).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-paper border border-ink/10 rounded-2xl p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] font-bold text-ink">{label}</p>
        <p className="text-[10px] text-ink-faint font-bold">
          直近7日 {total7}
          {prev7 > 0 && (
            <span className={total7 >= prev7 ? "text-jade-deep" : "text-plum"}>
              {" "}
              ({total7 >= prev7 ? "+" : ""}
              {total7 - prev7})
            </span>
          )}
        </p>
      </div>
      <div className="flex items-end gap-[2px] h-16">
        {metrics.map((m, i) => {
          const v = values[i]!;
          return (
            <div
              key={m.day}
              title={`${m.day}: ${v}`}
              className="flex-1 rounded-t-[3px] min-h-[2px]"
              style={{
                height: `${Math.max((v / max) * 100, v > 0 ? 6 : 2)}%`,
                background: v > 0 ? color : "rgba(10,31,61,0.08)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function toCsv(rows: Record<string, string | number | boolean | null>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: string | number | boolean | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? null)).join(",")),
  ].join("\n");
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
function fmtDateTime(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminClient({
  requests,
  communities,
  stats,
  members,
  threads,
  comments,
  contact,
  dailyMetrics = [],
}: {
  requests: RequestItem[];
  communities: CommunityItem[];
  stats: AdminStats;
  members: AdminMember[];
  threads: AdminThread[];
  comments: AdminComment[];
  contact: ContactSubmission[];
  dailyMetrics?: DailyMetric[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [, startTransition] = useTransition();

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  function act(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
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

  const [exporting, setExporting] = useState(false);
  function exportCsv() {
    setExporting(true);
    setError(null);
    startTransition(async () => {
      const res = await adminExportCompData();
      setExporting(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const csv = toCsv(res.rows);
      const blob = new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xborderhub-compensation-anonymized-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const q = memberSearch.trim().toLowerCase();
  const shownMembers = q
    ? members.filter(
        (m) =>
          (m.email ?? "").toLowerCase().includes(q) ||
          (m.display_name ?? "").toLowerCase().includes(q),
      )
    : members;

  return (
    <>
      <AppTopBar />

      <main className="container-app py-5 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-5">
          <section>
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
              🛠 admin console
            </p>
            <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
              管理コンソール
            </h1>
          </section>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-paper border border-ink/10 rounded-xl overflow-x-auto hide-scroll">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-colors ${
                  tab === t.id ? "bg-ink text-cream" : "text-ink-soft"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-[12px] font-bold text-red-600">{error}</p>
          )}

          {/* ===== OVERVIEW ===== */}
          {tab === "overview" && (
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {(
                [
                  ["会員", stats.members],
                  ["新規(7日)", stats.signups7d],
                  ["スレッド", stats.threads],
                  ["コメント", stats.comments],
                  ["Coffee Chat", stats.coffeeChats],
                  ["年収データ", stats.salaries],
                  ["トークルーム", stats.chatRooms],
                  ["コミュニティ", stats.communities],
                  ["未対応の問合せ", stats.contactNew],
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
          )}

          {/* ===== KPI DATA ROOM ===== */}
          {tab === "kpi" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[12px] text-ink-soft font-bold">
                  日次推移(直近30日)— 累計データ数: 年収{" "}
                  {stats.salaries ?? "—"} 件 / 会員 {stats.members ?? "—"} 人
                </p>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={exporting}
                  className="px-3 py-1.5 bg-ink text-cream rounded-full font-bold text-[11px] disabled:opacity-50"
                >
                  {exporting ? "生成中…" : "⬇ 匿名化CSVエクスポート(DD用)"}
                </button>
              </div>

              {dailyMetrics.length === 0 ? (
                <p className="text-[12px] text-ink-faint">
                  KPI データがありません(migration 0015 を実行してください)。
                </p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {KPI_SERIES.map((s) => (
                      <KpiChart
                        key={s.key}
                        metrics={dailyMetrics}
                        seriesKey={s.key}
                        label={s.label}
                        color={s.color}
                      />
                    ))}
                  </div>

                  {/* Numeric table — last 14 days (accessibility relief) */}
                  <div className="overflow-x-auto border border-ink/10 rounded-2xl">
                    <table className="w-full text-[11px] min-w-[560px]">
                      <thead>
                        <tr className="bg-paper text-ink-soft text-[10px] uppercase tracking-wider">
                          <th className="text-left font-bold p-2">日付</th>
                          {KPI_SERIES.map((s) => (
                            <th key={s.key} className="text-right font-bold p-2">
                              {s.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyMetrics.slice(-14).reverse().map((m) => (
                          <tr key={m.day} className="border-t border-ink/8">
                            <td className="p-2 text-ink-faint whitespace-nowrap">
                              {m.day}
                            </td>
                            {KPI_SERIES.map((s) => (
                              <td
                                key={s.key}
                                className="p-2 text-right text-ink tabular-nums"
                              >
                                {Number(m[s.key] ?? 0)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ===== MEMBERS ===== */}
          {tab === "members" && (
            <section className="space-y-3">
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="メール / 表示名で検索"
                className="field w-full"
              />
              <p className="text-[11px] text-ink-faint font-bold">
                {shownMembers.length} 件表示
                {members.length >= 200 && "(最新200件)"}
              </p>
              <div className="overflow-x-auto border border-ink/10 rounded-2xl">
                <table className="w-full text-[12px] min-w-[720px]">
                  <thead>
                    <tr className="bg-paper text-ink-soft text-[10px] uppercase tracking-wider">
                      <th className="text-left font-bold p-2">表示名</th>
                      <th className="text-left font-bold p-2">メール</th>
                      <th className="text-left font-bold p-2">登録日</th>
                      <th className="text-left font-bold p-2">最終アクセス</th>
                      <th className="text-left font-bold p-2">From→To</th>
                      <th className="text-left font-bold p-2">業界/職種</th>
                      <th className="text-right font-bold p-2">投稿</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownMembers.map((m) => (
                      <tr key={m.id} className="border-t border-ink/8">
                        <td className="p-2 font-bold text-ink whitespace-nowrap">
                          {m.display_name ?? (
                            <span className="text-ink-faint">未設定</span>
                          )}
                          {m.is_admin && (
                            <span className="ml-1 text-[9px] bg-mustard text-ink px-1.5 py-0.5 rounded-full font-bold">
                              管理
                            </span>
                          )}
                          {!m.onboarded_at && (
                            <span className="ml-1 text-[9px] bg-ink/10 text-ink-faint px-1.5 py-0.5 rounded-full font-bold">
                              未完了
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-ink-soft whitespace-nowrap">
                          {m.email ?? "—"}
                        </td>
                        <td className="p-2 text-ink-faint whitespace-nowrap">
                          {fmtDate(m.created_at)}
                        </td>
                        <td className="p-2 text-ink-faint whitespace-nowrap">
                          {fmtDateTime(m.last_sign_in_at)}
                        </td>
                        <td className="p-2 text-ink-soft whitespace-nowrap">
                          {(m.from_country ?? "—") + " → " + (m.to_country ?? "—")}
                        </td>
                        <td className="p-2 text-ink-soft whitespace-nowrap">
                          {[m.industry, m.role].filter(Boolean).join(" / ") ||
                            "—"}
                        </td>
                        <td className="p-2 text-right text-ink-soft whitespace-nowrap">
                          {m.thread_count}投 / {m.comment_count}コ
                        </td>
                      </tr>
                    ))}
                    {shownMembers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-4 text-center text-ink-faint"
                        >
                          該当する会員がいません。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ===== CONTENT MODERATION ===== */}
          {tab === "content" && (
            <section className="space-y-6">
              <div>
                <h2 className="display font-bold text-[16px] text-ink mb-2">
                  スレッド ({threads.length})
                </h2>
                <div className="space-y-1.5">
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 bg-cream border border-ink/10 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/thread?id=${t.id}`}
                          className="font-bold text-[13px] text-ink hover:underline truncate block"
                        >
                          {t.title}
                        </Link>
                        <p className="text-[10px] text-ink-faint">
                          {t.author_name} · {fmtDate(t.created_at)} · 💬{" "}
                          {t.comment_count}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy === t.id}
                        onClick={() => {
                          if (!confirm(`スレッド「${t.title}」を削除しますか?`))
                            return;
                          act(t.id, () =>
                            adminDeleteThread({ threadId: t.id }),
                          );
                        }}
                        className="px-2.5 py-1 bg-cream border border-red-300 text-red-600 rounded-full font-bold text-[11px] disabled:opacity-50 whitespace-nowrap"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  {threads.length === 0 && (
                    <p className="text-[12px] text-ink-faint">
                      スレッドがありません。
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="display font-bold text-[16px] text-ink mb-2">
                  コメント ({comments.length})
                </h2>
                <div className="space-y-1.5">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 bg-cream border border-ink/10 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-ink truncate">{c.body}</p>
                        <p className="text-[10px] text-ink-faint">
                          {c.author_name} ·{" "}
                          <Link
                            href={`/thread?id=${c.thread_id}`}
                            className="hover:underline"
                          >
                            {c.thread_title ?? "スレッド"}
                          </Link>{" "}
                          · {fmtDate(c.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy === c.id}
                        onClick={() => {
                          if (!confirm("このコメントを削除しますか?")) return;
                          act(c.id, () =>
                            adminDeleteComment({ commentId: c.id }),
                          );
                        }}
                        className="px-2.5 py-1 bg-cream border border-red-300 text-red-600 rounded-full font-bold text-[11px] disabled:opacity-50 whitespace-nowrap"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-[12px] text-ink-faint">
                      コメントがありません。
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ===== CONTACT ===== */}
          {tab === "contact" && (
            <section className="space-y-2">
              {contact.length === 0 ? (
                <p className="text-[12px] text-ink-faint">
                  お問い合わせはありません。
                </p>
              ) : (
                contact.map((c) => (
                  <div
                    key={c.id}
                    className="bg-cream border border-ink/10 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-bold text-[13px] text-ink">
                        {c.subject}
                      </p>
                      <select
                        value={c.status}
                        disabled={busy === c.id}
                        onChange={(e) =>
                          act(c.id, () =>
                            updateContactStatus({
                              id: c.id,
                              status: e.target.value as
                                | "new"
                                | "in_progress"
                                | "resolved",
                            }),
                          )
                        }
                        className="filter-select !w-auto !py-1 !text-[11px]"
                      >
                        <option value="new">未対応</option>
                        <option value="in_progress">対応中</option>
                        <option value="resolved">完了</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-ink-soft mb-1">
                      {c.name ? `${c.name} · ` : ""}
                      {c.email} · {c.category} · {fmtDate(c.created_at)}
                    </p>
                    <p className="text-[12px] text-ink-soft leading-relaxed border-t border-dashed border-ink/15 pt-2 mt-1 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </section>
          )}

          {/* ===== COMMUNITIES ===== */}
          {tab === "communities" && (
            <div className="space-y-6">
              <section>
                <h2 className="display font-bold text-[16px] text-ink mb-3">
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
                            {fmtDate(r.createdAt)}
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

              <section>
                <h2 className="display font-bold text-[16px] text-ink mb-3">
                  コミュニティ ({communities.length})
                </h2>
                {communities.length === 0 ? (
                  <p className="text-[12px] text-ink-faint">
                    コミュニティがまだありません。
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

              {reviewed.length > 0 && (
                <section>
                  <h2 className="display font-bold text-[16px] text-ink mb-3">
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
            </div>
          )}

          <p className="text-[11px] text-ink-faint leading-relaxed pt-2">
            ※ このページは profiles.is_admin = true のアカウントのみ表示されます。
          </p>
        </div>
      </main>
    </>
  );
}
