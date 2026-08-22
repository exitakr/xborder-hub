import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * CSV export of the admin tables.
 *
 * A dashboard answers the questions you thought to put on it. A buyer's
 * accountant will have questions nobody anticipated, and the difference
 * between "here is a spreadsheet" and "I'll get back to you" is the
 * difference between a diligence process that keeps moving and one that
 * stalls. It is also the only honest way to hand over the numbers: a
 * screenshot of a dashboard is not evidence, a file that can be summed is.
 *
 * Authorisation is the database's, not this route's: every function called
 * here re-checks `is_admin()` and returns nothing to anyone else. The check
 * below is a courtesy that produces a clean 403 instead of an empty file.
 */
const EXPORTS = {
  members: { fn: "admin_user_portfolios", args: { p_limit: 5000 } },
  items: { fn: "admin_top_items", args: { p_limit: 2000 } },
  messages: { fn: "admin_contact_messages", args: { p_limit: 5000 } },
} as const;

type ExportKind = keyof typeof EXPORTS;

function isExportKind(v: string | null): v is ExportKind {
  return v !== null && v in EXPORTS;
}

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("type");
  if (!isExportKind(kind)) {
    return NextResponse.json({ error: "unknown export" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { fn, args } = EXPORTS[kind];
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  const csv = toCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      // BOM prefix, see toCsv: the type has to allow it through unchanged.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oma-${kind}-${stamp}.csv"`,
      // Members and messages are personal data. Nothing may cache this — not
      // the browser, not a proxy, not Vercel's edge.
      "Cache-Control": "no-store, private",
    },
  });
}

/**
 * Rows to CSV.
 *
 * Two things this has to get right, both of which bite in this dataset:
 *
 *  - A UTF-8 BOM. Excel on Japanese Windows reads a BOM-less UTF-8 CSV as
 *    Shift-JIS and turns every name into mojibake — which is exactly how these
 *    files will be opened.
 *  - Formula injection. A display name beginning `=`, `+`, `-` or `@` is
 *    executed by Excel when the file is opened. These are user-supplied
 *    strings, so each one is prefixed with a quote character to neutralise it.
 */
function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "﻿";

  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCell).join(",")];

  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }

  return `﻿${lines.join("\r\n")}\r\n`;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = String(value);

  // Neutralise anything a spreadsheet would treat as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
