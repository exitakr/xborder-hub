import type { Metadata } from "next";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = {
  title: "トークルーム",
};

export default function ChatPage() {
  return <ChatClient />;
}
