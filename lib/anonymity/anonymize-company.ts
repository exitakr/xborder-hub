/**
 * Map an exact company name to a generic category label so the UI can
 * show "where someone works" without identifying the individual. Used
 * everywhere we display a profile's company history to anyone other
 * than the owner.
 *
 * Patterns are matched in order; the first hit wins. Unknown companies
 * fall through to a generic "海外 / 日系" hint based on a couple of
 * heuristics, and finally to the original string.
 */

type Rule = { pattern: RegExp; label: string };

const RULES: Rule[] = [
  // Big Tech (FAANG+)
  {
    pattern: /\b(google|alphabet|meta|facebook|amazon|apple|microsoft|netflix|nvidia)\b/i,
    label: "外資系 Big Tech",
  },
  // ASEAN unicorns
  {
    pattern: /\b(shopee|sea group|grab|gojek|goto|lazada|tokopedia|traveloka|carousell|ninja van|tiktok|bytedance)\b/i,
    label: "ASEAN ユニコーン",
  },
  // Global consulting
  {
    pattern: /\b(mckinsey|bcg|bain|deloitte|accenture|pwc|ey|kpmg)\b/i,
    label: "外資系コンサル",
  },
  // Japanese mega-corps
  {
    pattern: /\b(sony|toyota|honda|panasonic|hitachi|nintendo|nec|fujitsu|toshiba|nissan|mazda|subaru|denso|canon)\b/i,
    label: "日系大手メーカー",
  },
  // Global investment banks
  {
    pattern: /\b(goldman|morgan stanley|jp ?morgan|jpm|ubs|barclays|hsbc|citi|nomura|daiwa|mizuho|smbc|mufg)\b/i,
    label: "外資系金融",
  },
  // Japanese trading houses
  {
    pattern: /\b(mitsubishi corp|mitsui|sumitomo corp|itochu|marubeni|sojitz|toyota tsusho)\b/i,
    label: "日系総合商社",
  },
  // FMCG
  {
    pattern: /\b(p&g|procter|unilever|nestle|colgate|kao|shiseido|loreal|l'oreal)\b/i,
    label: "外資系 FMCG",
  },
  // Japanese tech / SaaS
  {
    pattern: /\b(rakuten|mercari|line|smartnews|recruit|dena|cyberagent|gree|gmo|sansan|freee|money forward)\b/i,
    label: "日系 Tech",
  },
  // Global SaaS / cloud
  {
    pattern: /\b(salesforce|workday|servicenow|atlassian|stripe|datadog|snowflake|databricks)\b/i,
    label: "外資系 SaaS",
  },
  // Pharma
  {
    pattern: /\b(takeda|astellas|daiichi sankyo|eisai|pfizer|merck|roche|novartis|gsk|abbvie)\b/i,
    label: "製薬",
  },
];

const FOREIGN_HINTS = /\b(corp|inc|ltd|llc|gmbh|sa|ag|pte|sdn|bhd|nv|bv)\b/i;
const JAPANESE_HINTS = /(株式会社|（株）|\(株\))/;

export function anonymizeCompany(companyName: string | null | undefined): string {
  if (!companyName) return "—";
  const trimmed = companyName.trim();

  for (const { pattern, label } of RULES) {
    if (pattern.test(trimmed)) return label;
  }

  if (JAPANESE_HINTS.test(trimmed)) return "日系企業";
  if (FOREIGN_HINTS.test(trimmed)) return "外資系企業";

  return trimmed;
}

/**
 * Anonymise a "Sony → Shopee" style multi-company string by splitting on
 * the arrow / 「→」character and running each piece through the rules.
 */
export function anonymizeCompanyChain(chain: string | null | undefined): string {
  if (!chain) return "—";
  return chain
    .split(/\s*[→\->]+\s*/)
    .filter(Boolean)
    .map(anonymizeCompany)
    .join(" → ");
}
