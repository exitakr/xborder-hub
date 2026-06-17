import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { fetchUserNotifications } from "@/lib/notifications/queries";
import type { AppNotification } from "@/lib/notifications/store";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = {
  title: "通知",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  await enforceOnboarding("/notifications");
  const rows = await fetchUserNotifications(user.id);
  const initial: AppNotification[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    group: r.group_label ?? undefined,
    title: r.title,
    body: r.body ?? undefined,
    href: r.href ?? undefined,
    read: r.read,
    createdAt: r.created_at,
  }));
  return <NotificationsClient initialServerNotifs={initial} />;
}
