import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "ホーム — 今、世界で起きている動き",
};

export default function HomePage() {
  return <HomeClient />;
}
