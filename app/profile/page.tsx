import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = {
  title: "プロフィール",
};

export default async function ProfilePage() {
  await requireUser("/profile");
  return <ProfileView />;
}
