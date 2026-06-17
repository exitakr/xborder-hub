import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = {
  title: "プロフィール",
};

export default async function ProfilePage() {
  await requireUser("/profile");
  await enforceOnboarding("/profile");
  return <ProfileView />;
}
