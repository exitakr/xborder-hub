import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { ThreadNewClient } from "./ThreadNewClient";

export const metadata: Metadata = {
  title: "新しいスレッド",
};

type Props = {
  searchParams: Promise<{ title?: string; category?: string }>;
};

const VALID_CATEGORIES = new Set([
  "career",
  "life",
  "visa",
  "salary",
  "family",
  "other",
]);

export default async function ThreadNewPage({ searchParams }: Props) {
  await requireUser("/thread/new");
  await enforceOnboarding("/thread/new");

  // Prefill support for the home page's 今日の質問 CTA (and any deep link).
  const { title, category } = await searchParams;
  const initialTitle = (title ?? "").slice(0, 120);
  const initialCategory =
    category && VALID_CATEGORIES.has(category) ? category : "";

  return (
    <ThreadNewClient
      initialTitle={initialTitle}
      initialCategory={initialCategory}
    />
  );
}
