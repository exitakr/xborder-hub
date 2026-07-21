import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { CheckClient } from "./CheckClient";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xbordercareer.com";

export const metadata: Metadata = {
  title: "海外転職 準備度チェック【1分・無料】",
  description:
    "海外転職・駐在・移住の準備度を1分で診断。英語力・資金・ビザ・タイミングをスコア化し、あなたの目標国の実データと経験者につなぎます。回答はプロフィールに自動反映。",
  alternates: { canonical: `${BASE}/check` },
  openGraph: {
    title: "海外転職 準備度チェック【1分・無料】",
    description: "あなたの海外キャリア準備度を1分で診断。",
    images: [`${BASE}/og/check?score=72`],
  },
};

export const dynamic = "force-dynamic";

export default async function CheckPage() {
  const user = await getCurrentUser();
  return <CheckClient isLoggedIn={!!user} />;
}
