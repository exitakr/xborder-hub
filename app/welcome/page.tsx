import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { needsOnboarding } from "@/lib/profile/onboarding";
import { WelcomeClient } from "./WelcomeClient";

export const metadata: Metadata = {
  title: "ようこそ",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function WelcomePage({ searchParams }: Props) {
  const user = await requireUser("/welcome");
  const { next } = await searchParams;

  // Already onboarded (or migration missing) — one-directional bounce,
  // never loops because nothing redirects back here.
  if (!(await needsOnboarding())) {
    redirect(next && next.startsWith("/") ? next : "/mypage");
  }

  // Pre-fill name from the email local-part so step 1 isn't a blocker.
  const initialName = user.email
    ? user.email.split("@")[0]!.replace(/[._-]/g, " ").trim()
    : "";

  return <WelcomeClient next={next} initialName={initialName} />;
}
