import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@kura/core";
import { getLocale } from "@/lib/i18n-server";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t.authSignUp}</h1>

      <div className="card p-5">
        <SignupForm t={t} />
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {t.authToSignIn}{" "}
        <Link href="/login" className="rounded font-medium text-accent hover:underline">
          {t.authSignIn}
        </Link>
      </p>
    </div>
  );
}
