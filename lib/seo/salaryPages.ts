/**
 * Catalog for the programmatic SEO pages /salaries/[country] and
 * /salaries/[country]/[role]. Slugs are English (URL requirement);
 * `db` values must match what compensation_data stores verbatim
 * (COUNTRY_OPTS / ROLE_OPTS in lib/profile/options.ts).
 *
 * 15 countries × 20 roles = 300 role pages + 15 country hubs.
 */

export type SeoCountry = {
  slug: string;
  db: string; // compensation_data.country の値
  ja: string;
  en: string;
  flag: string;
};

export type SeoRole = {
  slug: string;
  db: string; // compensation_data.role の値
  ja: string;
  en: string;
};

export const SEO_COUNTRIES: SeoCountry[] = [
  { slug: "singapore", db: "Singapore", ja: "シンガポール", en: "Singapore", flag: "🇸🇬" },
  { slug: "usa", db: "United States", ja: "アメリカ", en: "United States", flag: "🇺🇸" },
  { slug: "uk", db: "United Kingdom", ja: "イギリス", en: "United Kingdom", flag: "🇬🇧" },
  { slug: "australia", db: "Australia", ja: "オーストラリア", en: "Australia", flag: "🇦🇺" },
  { slug: "germany", db: "Germany", ja: "ドイツ", en: "Germany", flag: "🇩🇪" },
  { slug: "canada", db: "Canada", ja: "カナダ", en: "Canada", flag: "🇨🇦" },
  { slug: "hong-kong", db: "Hong Kong", ja: "香港", en: "Hong Kong", flag: "🇭🇰" },
  { slug: "thailand", db: "Thailand", ja: "タイ", en: "Thailand", flag: "🇹🇭" },
  { slug: "vietnam", db: "Vietnam", ja: "ベトナム", en: "Vietnam", flag: "🇻🇳" },
  { slug: "malaysia", db: "Malaysia", ja: "マレーシア", en: "Malaysia", flag: "🇲🇾" },
  { slug: "indonesia", db: "Indonesia", ja: "インドネシア", en: "Indonesia", flag: "🇮🇩" },
  { slug: "taiwan", db: "Taiwan", ja: "台湾", en: "Taiwan", flag: "🇹🇼" },
  { slug: "netherlands", db: "Netherlands", ja: "オランダ", en: "Netherlands", flag: "🇳🇱" },
  { slug: "uae", db: "United Arab Emirates", ja: "UAE(ドバイ)", en: "UAE", flag: "🇦🇪" },
  { slug: "philippines", db: "Philippines", ja: "フィリピン", en: "Philippines", flag: "🇵🇭" },
];

export const SEO_ROLES: SeoRole[] = [
  { slug: "software-engineer", db: "ソフトウェアエンジニア", ja: "ソフトウェアエンジニア", en: "Software Engineer" },
  { slug: "frontend-engineer", db: "フロントエンドエンジニア", ja: "フロントエンドエンジニア", en: "Frontend Engineer" },
  { slug: "data-scientist", db: "データサイエンティスト・ML", ja: "データサイエンティスト", en: "Data Scientist" },
  { slug: "infra-sre", db: "インフラ・SRE・DevOps", ja: "インフラ・SRE", en: "Infrastructure / SRE" },
  { slug: "product-manager", db: "プロダクトマネージャー", ja: "プロダクトマネージャー", en: "Product Manager" },
  { slug: "project-manager", db: "プロジェクトマネージャー", ja: "プロジェクトマネージャー", en: "Project Manager" },
  { slug: "designer", db: "UI/UXデザイナー", ja: "UI/UXデザイナー", en: "UI/UX Designer" },
  { slug: "sales", db: "法人営業", ja: "法人営業", en: "B2B Sales" },
  { slug: "overseas-sales", db: "海外営業", ja: "海外営業", en: "International Sales" },
  { slug: "marketing", db: "マーケティング・販促", ja: "マーケティング", en: "Marketing" },
  { slug: "consultant", db: "戦略・経営コンサルタント", ja: "戦略コンサルタント", en: "Strategy Consultant" },
  { slug: "it-consultant", db: "ITコンサルタント", ja: "ITコンサルタント", en: "IT Consultant" },
  { slug: "finance-accounting", db: "経理・財務", ja: "経理・財務", en: "Finance & Accounting" },
  { slug: "hr", db: "人事・採用", ja: "人事・採用", en: "HR / Recruiting" },
  { slug: "business-development", db: "事業企画・事業開発", ja: "事業開発", en: "Business Development" },
  { slug: "customer-success", db: "カスタマーサクセス・サポート", ja: "カスタマーサクセス", en: "Customer Success" },
  { slug: "supply-chain", db: "物流・サプライチェーン", ja: "物流・サプライチェーン", en: "Supply Chain" },
  { slug: "country-manager", db: "カントリーマネージャー", ja: "カントリーマネージャー", en: "Country Manager" },
  { slug: "researcher", db: "R&D・研究職", ja: "R&D・研究職", en: "R&D / Researcher" },
  { slug: "teacher", db: "教員・トレーナー・キャリアコンサルタント", ja: "教育・トレーナー", en: "Educator / Trainer" },
];

export function findCountry(slug: string): SeoCountry | undefined {
  return SEO_COUNTRIES.find((c) => c.slug === slug);
}
export function findRole(slug: string): SeoRole | undefined {
  return SEO_ROLES.find((r) => r.slug === slug);
}
