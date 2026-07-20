import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCountry, SEO_COUNTRIES } from "@/lib/seo/salaryPages";
import { fetchSalaryPageStats } from "@/lib/seo/salaryStats";
import { SalarySeoPage } from "./SalarySeoPage";

export const revalidate = 86400; // ISR: refresh aggregates daily
export const dynamicParams = false;

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xborder-hub.vercel.app";

export function generateStaticParams() {
  return SEO_COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const c = findCountry(slug);
  if (!c) return {};
  const title = `${c.ja}で働く日本人の年収・生活コスト【2026年実データ】`;
  const description = `${c.ja}の年収・家賃相場・ビザ・ワークライフバランスを、実際に現地で働く日本人の匿名投稿データで公開。${c.ja}への転職・駐在・移住の検討に。`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE}/salaries/${c.slug}` },
    openGraph: {
      title,
      description,
      images: [`${BASE}/og/salary?country=${c.slug}`],
    },
  };
}

export default async function CountrySalaryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: slug } = await params;
  const c = findCountry(slug);
  if (!c) notFound();
  const stats = await fetchSalaryPageStats(c.db);
  return <SalarySeoPage country={c} role={null} stats={stats} />;
}
