"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/profile/onboarding";

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
  if (await needsOnboarding()) {
    redirect(`/welcome?next=${encodeURIComponent(safeNext(next))}`);
  }
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
    if (await needsOnboarding()) {
      redirect(`/welcome?next=${encodeURIComponent(safeNext(next))}`);
    }
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

/**
 * Sends a password-recovery email via Supabase. The email link points back
 * to /auth/callback?next=/reset-password so the user ends up on the reset
 * form with a fresh recovery session.
 */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "メールアドレスを入力してください" };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    // We intentionally return the same success message even on "user not
    // found" so attackers can't enumerate registered emails. Real errors
    // (rate limit, malformed email) still surface.
    if (/rate limit/i.test(error.message)) {
      return {
        error:
          "送信回数の上限に達しました。しばらく待ってから再度お試しください。",
      };
    }
  }

  return {
    ok: true,
    message:
      "パスワード再設定リンクをメールで送信しました。受信箱(または迷惑メールフォルダ)のリンクをクリックして、新しいパスワードを設定してください。",
  };
}

/**
 * Updates the password for the currently authenticated user. Called from
 * /reset-password after the recovery session has been exchanged via
 * /auth/callback.
 */
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "パスワードは 8 文字以上で入力してください" };
  }
  if (password !== confirm) {
    return { error: "パスワードが一致しません" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "リカバリーセッションが見つかりません。もう一度メールのリンクからアクセスしてください。",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: friendly(error.message) };
  }

  redirect("/mypage");
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
