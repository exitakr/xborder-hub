import type { Metadata } from "next";
import { ThreadClient } from "./ThreadClient";

export const metadata: Metadata = {
  title: "スレッド詳細",
};

export default function ThreadPage() {
  return <ThreadClient />;
}
