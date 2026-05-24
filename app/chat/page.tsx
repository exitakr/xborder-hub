import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = {
  title: "トークルーム",
};

export default async function ChatPage() {
  await requireUser("/chat");
  return <ChatClient />;
}
