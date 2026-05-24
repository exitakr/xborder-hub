import type { Metadata } from "next";
import { HomeClient } from "./home/HomeClient";

export const metadata: Metadata = {
  title: "ホーム — 今、世界で起きている動き",
};

export default function RootPage() {
  return <HomeClient />;
}
