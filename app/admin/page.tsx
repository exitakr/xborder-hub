import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import {
  fetchAdminComments,
  fetchAdminMembers,
  fetchAdminStats,
  fetchAdminThreads,
  fetchCommunities,
  fetchCommunityRequests,
  fetchContactSubmissions,
  isCurrentUserAdmin,
} from "@/lib/admin/queries";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "管理コンソール",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser("/admin");

  // Non-admins get a 404 — the page should be invisible, not "forbidden".
  const admin = await isCurrentUserAdmin();
  if (!admin) notFound();

  const [
    requests,
    communities,
    stats,
    members,
    threads,
    comments,
    contact,
  ] = await Promise.all([
    fetchCommunityRequests(),
    fetchCommunities(),
    fetchAdminStats(),
    fetchAdminMembers(),
    fetchAdminThreads(),
    fetchAdminComments(),
    fetchContactSubmissions(),
  ]);

  return (
    <AdminClient
      requests={requests.map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        description: r.description,
        status: r.status,
        requesterName: r.requester?.display_name ?? "—",
        createdAt: r.created_at,
      }))}
      communities={communities.map((c) => ({
        id: c.id,
        kind: c.kind,
        label: c.label,
        active: c.active,
        membersCount: c.members_count,
      }))}
      stats={stats}
      members={members}
      threads={threads}
      comments={comments}
      contact={contact}
    />
  );
}
