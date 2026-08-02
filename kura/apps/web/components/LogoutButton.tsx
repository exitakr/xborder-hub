"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut();
      // refresh() re-runs the server layout so the header swaps to signed-out.
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
    >
      {label}
    </button>
  );
}
