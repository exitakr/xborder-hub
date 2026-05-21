import { redirect } from "next/navigation";

// During the migration, the landing page lives at /public/index.html.
// `next.config.ts` rewrites `/` to `/index.html`, but this server-side
// redirect acts as a safety net if rewrites are bypassed.
export default function RootPage(): never {
  redirect("/index.html");
}
