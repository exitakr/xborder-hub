import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { getCurrentProfile } from "@/lib/profiles/getProfile";
import {
  adaptReceivedRow,
  adaptSentRow,
  fetchReceivedCcRequests,
  fetchSentCcRequests,
} from "@/lib/coffee-chat/queries";
import { MyPageClient } from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireUser("/mypage");
  const [profile, sent, received] = await Promise.all([
    getCurrentProfile(),
    fetchSentCcRequests(user.id),
    fetchReceivedCcRequests(user.id),
  ]);
  return (
    <MyPageClient
      visibilitySettings={profile?.visibility_settings}
      dbCcSent={sent.map(adaptSentRow)}
      dbCcReceived={received.map(adaptReceivedRow)}
    />
  );
}
