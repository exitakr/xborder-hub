/**
 * Demo-content switch. Sample threads / sample members / demo Coffee Chat
 * cards are pre-launch filler — production hides them by default so every
 * visible item is real, admin-seeded content.
 *
 *   NEXT_PUBLIC_DEMO_CONTENT=1  → force samples ON (e.g. staging)
 *   NEXT_PUBLIC_DEMO_CONTENT=0  → force samples OFF (e.g. local prod test)
 *   unset                       → ON in development, OFF in production
 *
 * NEXT_PUBLIC_ vars are inlined at build time on both server and client,
 * so flipping the flag requires a redeploy.
 */
export const SHOW_DEMO_CONTENT =
  process.env.NEXT_PUBLIC_DEMO_CONTENT === "1" ||
  (process.env.NEXT_PUBLIC_DEMO_CONTENT === undefined &&
    process.env.NODE_ENV === "development");
