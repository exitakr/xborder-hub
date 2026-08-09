import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getLocale();
  const t = getDict(locale);
  const { next } = await searchParams;

  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/portfolio";

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t.authSignIn}</h1>

      <div className="card p-5">
        <LoginForm t={t} next={target} />
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {t.authToSignUp}{" "}
        <Link href="/signup" className="rounded font-medium text-accent hover:underline">
          {t.authSignUp}
        </Link>
      </p>
    </div>
  );
}
