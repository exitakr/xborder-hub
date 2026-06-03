import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = {
  title: "通知",
};

export default async function NotificationsPage() {
  await requireUser("/notifications");
  return <NotificationsClient />;
}
