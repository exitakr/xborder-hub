import Link from "next/link";

type Tab = "home" | "search" | "threads" | "mypage";

const ITEMS: { id: Tab; href: string; label: string }[] = [
  { id: "home", href: "/home", label: "🌏 ホーム" },
  { id: "search", href: "/search", label: "🔀 フロー検索" },
  { id: "threads", href: "/threads", label: "💬 スレッド" },
  { id: "mypage", href: "/mypage", label: "👤 マイページ" },
];

export function SideNavMenu({ active }: { active?: Tab }) {
  return (
    <div className="side-nav-card">
      <p className="text-[10px] uppercase tracking-[0.24em] text-ink-faint font-bold mb-3">
        メニュー
      </p>
      <nav className="space-y-1">
        {ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`side-nav-link ${active === item.id ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
