"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  className: string;
  children: ReactNode;
};

export function SubscribeButton({ className, children }: Props) {
  const router = useRouter();

  function handleClick() {
    // TODO: replace with Stripe Checkout once payments are wired up in Phase 6.
    alert(
      "決済画面に進みます(Stripe Checkout想定)\nデモ版のため、Premiumに切り替わります",
    );
    if (typeof window !== "undefined") {
      window.localStorage.setItem("xbh_premium", "1");
    }
    router.push("/mypage");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
