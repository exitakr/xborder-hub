import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import {
  fetchChatMessages,
  fetchChatRoom,
  fetchChatRooms,
  partnerOf,
} from "@/lib/chat/queries";
import { ChatClient } from "./ChatClient";
import { ChatRoomsList } from "./ChatRoomsList";

export const metadata: Metadata = {
  title: "トークルーム",
};

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  searchParams: Promise<{ room?: string; with?: string }>;
};

export default async function ChatPage({ searchParams }: Props) {
  const user = await requireUser("/chat");
  const { room: roomParam, with: withParam } = await searchParams;

  // Real DB-backed room
  if (roomParam && UUID_RE.test(roomParam)) {
    const room = await fetchChatRoom(roomParam);
    if (room) {
      const messages = await fetchChatMessages(roomParam);
      const partner = partnerOf(room, user.id);
      return (
        <ChatClient
          roomId={room.id}
          currentUserId={user.id}
          partnerName={partner.name}
          initialMessages={messages.map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            body: m.body,
            createdAt: m.created_at,
          }))}
        />
      );
    }
  }

  // Legacy demo path (?with=XX) — keep the walkthrough experience
  if (withParam) {
    return <ChatClient currentUserId={user.id} demoWith={withParam} />;
  }

  // No param: show the user's room list (inbox)
  const rooms = await fetchChatRooms();
  return (
    <ChatRoomsList
      rooms={rooms.map((r) => {
        const partner = partnerOf(r, user.id);
        return {
          id: r.id,
          partnerName: partner.name,
          lastMessageAt: r.last_message_at,
        };
      })}
    />
  );
}
