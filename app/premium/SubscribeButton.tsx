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
    // Payments are not live yet. For β we record the intent locally so the
    // user can preview Premium-gated UI; the real Stripe Checkout flow
    // will replace this in a follow-up.
    alert(
      "決済機能は近日公開です。β版ではプレミアム表示を一時的に有効化して、マイページに移動します。",
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
