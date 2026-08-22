import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t.authResetTitle}</h1>
      <p className="mb-6 text-sm text-muted">{t.authResetLead}</p>

      <div className="card p-5">
        <ForgotForm t={t} />
      </div>

      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="rounded font-medium text-accent hover:underline">
          {t.authBackToLogin}
        </Link>
      </p>
    </div>
  );
}
