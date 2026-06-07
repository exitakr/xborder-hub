import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "新しいパスワードを設定",
};

export default async function ResetPasswordPage() {
  // The user should arrive here with a recovery session created by
  // /auth/callback. If no session is present, send them back to the
  // password-reset request flow so they can ask for a fresh link.
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    redirect(
      "/login/forgot?error=" +
        encodeURIComponent(
          "リカバリーリンクの有効期限が切れています。再送してください。",
        ),
    );
  }

  return <ResetForm />;
}
