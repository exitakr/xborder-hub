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
  await requireUser("/welcome");
  const { next } = await searchParams;

  // Already onboarded (or migration missing) — one-directional bounce,
  // never loops because nothing redirects back here.
  if (!(await needsOnboarding())) {
    redirect(next && next.startsWith("/") ? next : "/mypage");
  }

  return <WelcomeClient next={next} />;
}
