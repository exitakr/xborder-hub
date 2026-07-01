"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Renders an "管理" nav entry only for signed-in admins. Does one lightweight
 * client-side is_admin check on mount. Non-admins (and signed-out visitors)
 * see nothing — /admin itself still 404s for them regardless.
 */
export function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data?.is_admin) setIsAdmin(true);
      } catch {
        /* silent — no admin link on any error */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold whitespace-nowrap transition-colors text-blue hover:text-blue-deep hidden lg:inline-block"
      title="管理コンソール"
    >
      管理
    </Link>
  );
}
