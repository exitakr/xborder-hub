import type { Metadata } from "next";
import { redirectIfSignedIn } from "@/lib/auth/guard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン / 新規登録",
};

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  await redirectIfSignedIn(next ?? "/mypage");
  return <LoginForm next={next ?? "/mypage"} initialError={error} />;
}
