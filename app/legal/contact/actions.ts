"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ContactCategory =
  | "general"
  | "account"
  | "report"
  | "business"
  | "bug";

const VALID_CATEGORIES = new Set<ContactCategory>([
  "general",
  "account",
  "report",
  "business",
  "bug",
]);

export type ContactState =
  | { ok?: undefined; error?: undefined }
  | { ok: true }
  | { ok?: undefined; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Accept a contact-form submission. Persists into contact_submissions
 * (migration 0008) which the operator can review from Supabase Dashboard
 * → Table Editor. Anonymous users may submit; authenticated users' rows
 * carry their user_id so they can later view their own history.
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "general");
  // Honeypot — humans don't fill hidden fields.
  const honeypot = String(formData.get("website") ?? "");

  if (honeypot) return { ok: true }; // silently accept and discard
  if (!EMAIL_RE.test(email))
    return { error: "メールアドレスの形式が正しくありません。" };
  if (subject.length < 1 || subject.length > 200)
    return { error: "件名は 1〜200 文字で入力してください。" };
  if (body.length < 10 || body.length > 4000)
    return { error: "本文は 10〜4000 文字で入力してください。" };
  const category = VALID_CATEGORIES.has(categoryRaw as ContactCategory)
    ? (categoryRaw as ContactCategory)
    : "general";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const h = await headers();
    const ipHeader =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    const { error } = await supabase.from("contact_submissions").insert({
      user_id: user?.id ?? null,
      email,
      name: name || null,
      category,
      subject,
      body,
      ip: ipHeader,
      user_agent: userAgent,
    });

    if (error) {
      if (/relation .* does not exist/i.test(error.message)) {
        return {
          error:
            "DB がまだ準備できていません。supabase/migrations/0008_contact_submissions.sql を実行してください。",
        };
      }
      console.error("[contact] submitContact", error);
      return { error: "送信に失敗しました。時間をおいてお試しください。" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[contact] submitContact (catch)", err);
    return { error: "通信エラーが発生しました。" };
  }
}
