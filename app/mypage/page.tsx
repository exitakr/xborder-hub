import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { getCurrentProfile } from "@/lib/profiles/getProfile";
import { MyPageClient } from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export default async function MyPage() {
  await requireUser("/mypage");
  const profile = await getCurrentProfile();
  return (
    <MyPageClient
      visibilitySettings={profile?.visibility_settings}
    />
  );
}
