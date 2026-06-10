import Link from "next/link";
import { AppTopBar } from "@/components/site/AppTopBar";
import { BottomNavMobile } from "@/components/site/BottomNavMobile";

function initialsOf(name: string): string {
  const cleaned = name.replace(/(さん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  }
  return Array.from(cleaned).slice(0, 2).join("");
}

function whenLabel(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function ChatRoomsList({
  rooms,
}: {
  rooms: { id: string; partnerName: string; lastMessageAt: string | null }[];
}) {
  return (
    <>
      <AppTopBar />

      <main className="container-app py-4 lg:py-6 relative z-10 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <section>
            <p className="text-[10px] uppercase tracking-[0.24em] text-ink-soft font-bold">
              💬 talk rooms
            </p>
            <h1 className="display font-bold text-[22px] sm:text-[26px] leading-tight tracking-tight text-ink mt-0.5">
              トークルーム
            </h1>
          </section>

          {rooms.length === 0 ? (
            <div className="bg-paper border border-ink rounded-2xl p-8 text-center shadow-pop-sm">
              <p className="text-3xl mb-2">☕</p>
              <p className="display font-bold text-[15px] text-ink">
                トークルームはまだありません
              </p>
              <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed">
                Coffee Chat が承認されると、ここに相手とのトークルームが
                開きます。気になる人を探して申請してみましょう。
              </p>
              <Link
                href="/search"
                className="mt-4 inline-block btn-primary text-[12px] py-2"
              >
                キャリア検索へ →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((r) => (
                <Link
                  key={r.id}
                  href={`/chat?room=${r.id}`}
                  className="flex items-center gap-3 bg-cream border border-ink/20 hover:border-ink rounded-2xl p-3.5 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-jade text-ink font-bold flex items-center justify-center text-sm border border-ink/15 flex-shrink-0">
                    {initialsOf(r.partnerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] text-ink truncate">
                      {r.partnerName} さん
                    </p>
                    <p className="text-[11px] text-ink-faint">Coffee Chat</p>
                  </div>
                  <span className="text-[10px] text-ink-faint font-bold whitespace-nowrap">
                    {whenLabel(r.lastMessageAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNavMobile />
    </>
  );
}
