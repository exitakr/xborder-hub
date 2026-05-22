"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "./LogoMark";

type Tab = "home" | "search" | "threads";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AppTopBar({ active }: { active?: Tab }) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Detect already-installed (standalone) mode.
    const mq = window.matchMedia("(display-mode: standalone)");
    if (mq.matches) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleLogoClick(e: React.MouseEvent) {
    if (installEvent) {
      e.preventDefault();
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setInstallEvent(null);
      return;
    }
    if (installed) return; // default link to /home
    // iOS doesn't expose beforeinstallprompt — show a hint.
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua) && !/(Chrome|FxiOS|CriOS)/.test(ua)) {
        e.preventDefault();
        alert(
          "ホーム画面に追加するには、Safari の共有ボタン → 「ホーム画面に追加」を選んでください。",
        );
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-ink/10">
      <div className="container-app py-2.5 flex items-center justify-between gap-2">
        <Link
          href="/home"
          onClick={handleLogoClick}
          className="flex items-center gap-2 flex-shrink-0"
          title={
            installEvent
              ? "ホーム画面に追加できます"
              : installed
                ? "X Border Hub"
                : "ホームに戻る"
          }
        >
          <LogoMark />
          <div className="hidden sm:block">
            <div className="display font-bold text-[14px] leading-none tracking-tight text-ink">
              X Border Hub
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-ink-faint mt-0.5">
              Global Career Path
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/home"
            className={`${navClass(active === "home")} hidden lg:inline-block`}
          >
            ホーム
          </Link>
          <Link
            href="/search"
            className={`${navClass(active === "search")} hidden lg:inline-block`}
          >
            キャリア検索
          </Link>
          <Link
            href="/threads"
            className={`${navClass(active === "threads")} hidden lg:inline-block`}
          >
            スレッド
          </Link>
          <Link
            href="/mypage"
            className="ml-1 w-9 h-9 rounded-full bg-mustard border-[1.5px] border-ink flex items-center justify-center text-[12px] font-bold shadow-pop-sm text-ink flex-shrink-0"
            aria-label="マイページ"
          >
            YT
          </Link>
        </nav>
      </div>
    </header>
  );
}

function navClass(active: boolean) {
  return [
    "px-2 sm:px-3 py-1.5 rounded-lg",
    "text-[11px] sm:text-[12px] font-bold whitespace-nowrap",
    "transition-colors",
    active ? "text-blue bg-blue-soft/40" : "text-ink-soft hover:text-ink",
  ].join(" ");
}
