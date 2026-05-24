import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { MyPageClient } from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export default async function MyPage() {
  await requireUser("/mypage");
  return <MyPageClient />;
}
