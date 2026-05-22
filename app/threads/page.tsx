import type { Metadata } from "next";
import { ThreadsClient } from "./ThreadsClient";

export const metadata: Metadata = {
  title: "スレッド",
};

export default function ThreadsPage() {
  return <ThreadsClient />;
}
