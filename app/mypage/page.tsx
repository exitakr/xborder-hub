import type { Metadata } from "next";
import { MyPageClient } from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export default function MyPage() {
  return <MyPageClient />;
}
