"use client";

import Link from "next/link";
import { useNotifications } from "@/lib/notifications/store";

type Tab = "home" | "search" | "threads" | "salaries" | "notifications";

const TABS: {
  id: Tab;
  href: string;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "home",
    href: "/home",
    label: "ホーム",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </svg>
    ),
  },
  {
    id: "search",
    href: "/search",
    label: "検索",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 12 L 9 6 L 9 9 L 15 9 L 15 6 L 21 12 L 15 18 L 15 15 L 9 15 L 9 18 Z" />
      </svg>
    ),
  },
  {
    id: "threads",
    href: "/threads",
    label: "スレッド",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "salaries",
    href: "/salaries",
    label: "年収",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 3l6 7 6-7M12 10v11M7.5 13.5h9M7.5 17h9" />
      </svg>
    ),
  },
  {
    id: "notifications",
    href: "/notifications",
    label: "通知",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
];

export function BottomNavMobile({ active }: { active?: Tab }) {
  const { unread } = useNotifications();
  return (
    <nav className="bottom-nav-mobile fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t border-ink/10 z-40">
      <div className="container-app py-2 flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const showBadge = tab.id === "notifications" && unread > 0;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 relative ${
                isActive ? "text-ink" : "text-ink-soft"
              }`}
            >
              <span className="relative inline-flex">
                {tab.icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue text-cream text-[9px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
