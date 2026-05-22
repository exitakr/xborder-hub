import type { Metadata } from "next";
import { ThreadNewClient } from "./ThreadNewClient";

export const metadata: Metadata = {
  title: "新しいスレッド",
};

export default function ThreadNewPage() {
  return <ThreadNewClient />;
}
