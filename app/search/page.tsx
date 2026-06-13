import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { fetchMemberPeople } from "@/lib/people/queries";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "フロー検索",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    country?: string; // alias accepted from /home trends, treated as `to`
    industry?: string;
    role?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  const members = await fetchMemberPeople(user?.id);
  return (
    <SearchClient
      isLoggedIn={!!user}
      dbPeople={members}
      initial={{
        from: sp.from ?? "",
        // /home links use `country` for the destination filter; map it onto
        // `to` so visitors land on results for that country.
        to: sp.to ?? sp.country ?? "",
        industry: sp.industry ?? "",
        role: sp.role ?? "",
      }}
    />
  );
}
