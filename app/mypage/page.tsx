import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { getCurrentProfile } from "@/lib/profiles/getProfile";
import {
  adaptReceivedRow,
  adaptSentRow,
  fetchReceivedCcRequests,
  fetchSentCcRequests,
} from "@/lib/coffee-chat/queries";
import { fetchOwnCompRow } from "@/lib/compensation/queries";
import { MyPageClient } from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireUser("/mypage");
  await enforceOnboarding("/mypage");
  const [profile, sent, received, ownComp] = await Promise.all([
    getCurrentProfile(),
    fetchSentCcRequests(user.id),
    fetchReceivedCcRequests(user.id),
    fetchOwnCompRow(),
  ]);
  return (
    <MyPageClient
      visibilitySettings={profile?.visibility_settings}
      dbCcSent={sent.map(adaptSentRow)}
      dbCcReceived={received.map(adaptReceivedRow)}
      ownComp={ownComp}
    />
  );
}
