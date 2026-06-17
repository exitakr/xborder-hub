import { redirect } from "next/navigation";

/**
 * /premium was the paid-tier landing page in the previous business model.
 * We now offer all features to every signed-in member and will monetize
 * later through B2B job-advertising. Any stale links from email or old
 * shares land here and bounce silently to /home instead of 404'ing.
 */
export default function PremiumPage(): never {
  redirect("/home");
}
