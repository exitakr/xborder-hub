import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  findCountry,
  findRole,
  SEO_COUNTRIES,
  SEO_ROLES,
} from "@/lib/seo/salaryPages";
import { fetchSalaryPageStats } from "@/lib/seo/salaryStats";
import { SalarySeoPage } from "../SalarySeoPage";

export const revalidate = 86400; // ISR: refresh aggregates daily
export const dynamicParams = false;

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xborder-hub.vercel.app";

export function generateStaticParams() {
  return SEO_COUNTRIES.flatMap((c) =>
    SEO_ROLES.map((r) => ({ country: c.slug, role: r.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; role: string }>;
}): Promise<Metadata> {
  const { country: cSlug, role: rSlug } = await params;
  const c = findCountry(cSlug);
  const r = findRole(rSlug);
  if (!c || !r) return {};
  const title = `${c.ja} ${r.ja}の年収・生活コスト【2026年実データ】`;
  const description = `${c.ja}で${r.ja}として働く日本人の年収レンジ・家賃・ビザ・WLBを匿名実データで公開。${c.ja}転職・駐在の年収相場の検討に。`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/salaries/${c.slug}/${r.slug}` },
    openGraph: {
      title,
      description,
      images: [`${BASE}/og/salary?country=${c.slug}&role=${r.slug}`],
    },
  };
}

export default async function RoleSalaryPage({
  params,
}: {
  params: Promise<{ country: string; role: string }>;
}) {
  const { country: cSlug, role: rSlug } = await params;
  const c = findCountry(cSlug);
  const r = findRole(rSlug);
  if (!c || !r) notFound();
  const stats = await fetchSalaryPageStats(c.db, r.db);
  return <SalarySeoPage country={c} role={r} stats={stats} />;
}
