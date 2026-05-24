import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "フロー検索",
};

export default async function SearchPage() {
  const user = await getCurrentUser();
  return <SearchClient isLoggedIn={!!user} />;
}
