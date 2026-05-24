"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

async function siteOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function signInWithPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: friendly(error.message) };
  }

  const next = String(formData.get("next") ?? "/mypage");
  redirect(safeNext(next));
}

export async function signUpWithPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) {
    return { error: "パスワードは 8 文字以上で入力してください" };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return { error: friendly(error.message) };
  }

  // If Supabase project has "Confirm email" turned OFF, signUp returns a
  // session immediately and we can drop the user straight into the app.
  if (data.session) {
    const next = String(formData.get("next") ?? "/mypage");
    redirect(safeNext(next));
  }

  // Otherwise an email confirmation was queued. The user has to click the
  // link before they can sign in.
  return {
    ok: true,
    message:
      "確認メールを送信しました。受信箱(または迷惑メールフォルダ)のリンクをクリックして登録を完了してください。届かない場合は数分待ってから再度お試しください。",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function safeNext(next: string) {
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/mypage";
}

function friendly(message: string) {
  if (/Invalid login credentials/i.test(message)) {
    return "メールアドレスまたはパスワードが間違っています";
  }
  if (/Email not confirmed/i.test(message)) {
    return "メールアドレスの確認が完了していません。受信箱のリンクをご確認ください。";
  }
  if (/User already registered/i.test(message)) {
    return "このメールアドレスは既に登録されています。ログインしてください。";
  }
  if (/rate limit/i.test(message)) {
    return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
  }
  if (/email.*not.*allowed|disabled/i.test(message)) {
    return "サインアップが無効化されているか、メールが許可されていません。管理者にお問い合わせください。";
  }
  return message;
}
