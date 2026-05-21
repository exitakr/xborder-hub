import Link from "next/link";

type Tab = "home" | "search" | "threads" | "mypage";

const TABS: { id: Tab; href: string; label: string; icon: React.ReactNode }[] = [
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
    id: "mypage",
    href: "/mypage",
    label: "自分",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
      </svg>
    ),
  },
];

export function BottomNavMobile({ active }: { active?: Tab }) {
  return (
    <nav className="bottom-nav-mobile fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t-[1.5px] border-ink/10 z-40">
      <div className="container-app py-2 flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 relative ${
                isActive ? "text-ink" : "text-ink-soft"
              }`}
            >
              {tab.icon}
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
