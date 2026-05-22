import type { Metadata } from "next";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "フロー検索",
};

export default function SearchPage() {
  return <SearchClient />;
}
