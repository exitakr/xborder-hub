import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { requireProfile } from "@/lib/profile";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "New password", robots: { index: false } };

/**
 * Set a new password.
 *
 * `requireProfile` is the authorisation: this page is reachable only with the
 * recovery session that the emailed link established, and anyone arriving
 * without one is sent to sign in. There is no "current password" field because
 * the person completing a reset does not have one — the session is the proof.
 */
export default async function ResetPage() {
  const profile = await requireProfile();
  const t = getDict(profile.locale);

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t.authResetTitle}</h1>
      <div className="card p-5">
        <ResetForm t={t} />
      </div>
    </div>
  );
}
