import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { fetchPublicProfile } from "@/lib/profiles/getProfile";
import { ProfileView } from "../ProfileView";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "プロフィール" };
  const res = await fetchPublicProfile(id);
  if (!res) return { title: "プロフィール" };
  const name = res.profile.name;
  return {
    title: `${name} さんのプロフィール`,
    description: res.profile.bio?.slice(0, 120) || undefined,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // Viewing your own id → render the editable own-profile view.
  if (user.id === id) {
    return <ProfileView />;
  }

  const res = await fetchPublicProfile(id);
  if (!res) notFound();

  return <ProfileView viewProfile={res.profile} targetUserId={res.userId} />;
}
