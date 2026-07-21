/**
 * 海外転職 準備度チェック — question definitions + scoring.
 *
 * Two kinds of question:
 *  - `field` questions map the answer onto the member profile (country /
 *    industry / role / salary / goals) so completing the check populates the
 *    profile, the career level, and the /search directory automatically.
 *  - scored-only questions (english / savings / visa / timeline) feed the
 *    0-100 readiness score but aren't persisted (no matching profile column).
 */

export type Choice = { v: string; label: string; score?: number };

export type Question = {
  id: string;
  title: string;
  hint?: string;
  choices: Choice[];
  /** Which readiness dimension the score counts toward (for gap advice). */
  dim?: "english" | "savings" | "visa" | "timeline";
  /** Max score contribution of this question. */
  weight?: number;
};

// Curated chip subsets — values MUST match compensation_data / options.ts
const COUNTRY_CHOICES: Choice[] = [
  { v: "Japan", label: "🇯🇵 日本" },
  { v: "Singapore", label: "🇸🇬 シンガポール" },
  { v: "United States", label: "🇺🇸 アメリカ" },
  { v: "United Kingdom", label: "🇬🇧 イギリス" },
  { v: "Australia", label: "🇦🇺 オーストラリア" },
  { v: "Germany", label: "🇩🇪 ドイツ" },
  { v: "Canada", label: "🇨🇦 カナダ" },
  { v: "Hong Kong", label: "🇭🇰 香港" },
  { v: "Thailand", label: "🇹🇭 タイ" },
  { v: "United Arab Emirates", label: "🇦🇪 UAE" },
  { v: "Other", label: "🌏 その他" },
];

const INDUSTRY_CHOICES: Choice[] = [
  { v: "Tech", label: "IT / テック" },
  { v: "Finance", label: "金融" },
  { v: "Consulting", label: "コンサル" },
  { v: "Startup", label: "スタートアップ" },
  { v: "Manufacturing", label: "製造業" },
  { v: "Healthcare", label: "ヘルスケア" },
  { v: "Consumer", label: "消費財 / 小売" },
  { v: "Other", label: "その他" },
];

const ROLE_CHOICES: Choice[] = [
  { v: "ソフトウェアエンジニア", label: "エンジニア" },
  { v: "プロダクトマネージャー", label: "PM" },
  { v: "データサイエンティスト・ML", label: "データ / ML" },
  { v: "UI/UXデザイナー", label: "デザイナー" },
  { v: "法人営業", label: "営業 / BD" },
  { v: "マーケティング・販促", label: "マーケティング" },
  { v: "戦略・経営コンサルタント", label: "コンサルタント" },
  { v: "経理・財務", label: "経理・財務" },
  { v: "人事・採用", label: "人事" },
  { v: "事業企画・事業開発", label: "事業開発" },
  { v: "カスタマーサクセス・サポート", label: "カスタマーサクセス" },
  { v: "その他", label: "その他" },
];

const SALARY_CHOICES: Choice[] = [
  { v: "lt_400", label: "〜400万円" },
  { v: "400_600", label: "400〜600万円" },
  { v: "600_800", label: "600〜800万円" },
  { v: "800_1000", label: "800〜1,000万円" },
  { v: "1000_1300", label: "1,000〜1,300万円" },
  { v: "1300_1600", label: "1,300〜1,600万円" },
  { v: "1600_2000", label: "1,600〜2,000万円" },
  { v: "gte_2000", label: "2,000万円以上" },
];

/** Questions whose answers are written to the profile. Keyed by profile use. */
export type FieldKey =
  | "currentCountry"
  | "currentIndustry"
  | "currentRole"
  | "currentSalary"
  | "goalCountry"
  | "goalRole";

export const FIELD_QUESTIONS: { key: FieldKey; q: Question }[] = [
  {
    key: "currentCountry",
    q: { id: "cc", title: "今どこで働いていますか?", choices: COUNTRY_CHOICES },
  },
  {
    key: "currentIndustry",
    q: { id: "ci", title: "今の業界は?", choices: INDUSTRY_CHOICES },
  },
  {
    key: "currentRole",
    q: { id: "cr", title: "今の職種は?", choices: ROLE_CHOICES },
  },
  {
    key: "currentSalary",
    q: {
      id: "cs",
      title: "現在の年収レンジは?",
      hint: "検索プロフィールに匿名レンジとして反映されます",
      choices: SALARY_CHOICES,
    },
  },
  {
    key: "goalCountry",
    q: { id: "gc", title: "どの国で働きたいですか?", choices: COUNTRY_CHOICES },
  },
  {
    key: "goalRole",
    q: {
      id: "gr",
      title: "目標の職種は?",
      choices: [{ v: "__same", label: "今と同じ" }, ...ROLE_CHOICES],
    },
  },
];

export const SCORED_QUESTIONS: Question[] = [
  {
    id: "english",
    dim: "english",
    weight: 30,
    title: "英語での業務はどのくらいできますか?",
    choices: [
      { v: "none", label: "ほぼできない", score: 0 },
      { v: "daily", label: "日常会話レベル", score: 12 },
      { v: "business", label: "ビジネスレベル", score: 24 },
      { v: "native", label: "ネイティブ / 支障なし", score: 30 },
    ],
  },
  {
    id: "savings",
    dim: "savings",
    weight: 25,
    title: "生活何ヶ月分の蓄えがありますか?",
    hint: "移住初期の無収入期間に耐える資産の目安です",
    choices: [
      { v: "lt3", label: "3ヶ月未満", score: 3 },
      { v: "3_6", label: "3〜6ヶ月", score: 12 },
      { v: "6_12", label: "6〜12ヶ月", score: 20 },
      { v: "gte12", label: "1年以上", score: 25 },
    ],
  },
  {
    id: "visa",
    dim: "visa",
    weight: 25,
    title: "就労ビザの準備状況は?",
    choices: [
      { v: "none", label: "まだ調べていない", score: 0 },
      { v: "research", label: "調査中", score: 10 },
      { v: "know", label: "取得条件を把握済み", score: 18 },
      { v: "ready", label: "取得済み / 不要", score: 25 },
    ],
  },
  {
    id: "timeline",
    dim: "timeline",
    weight: 20,
    title: "いつ頃動きたいですか?",
    choices: [
      { v: "someday", label: "いつか", score: 4 },
      { v: "1_2y", label: "1〜2年以内", score: 12 },
      { v: "6m", label: "半年以内", score: 18 },
      { v: "now", label: "今すぐ動いている", score: 20 },
    ],
  },
];

export const DIM_LABEL: Record<string, string> = {
  english: "英語力",
  savings: "資金の余裕",
  visa: "ビザ準備",
  timeline: "行動の具体度",
};

export function scoreOf(answers: Record<string, string>): number {
  let total = 0;
  for (const q of SCORED_QUESTIONS) {
    const a = answers[q.id];
    const c = q.choices.find((x) => x.v === a);
    total += c?.score ?? 0;
  }
  return Math.min(100, total);
}

/** The two weakest dimensions → actionable advice on the result screen. */
export function weakestDims(answers: Record<string, string>): string[] {
  return SCORED_QUESTIONS.map((q) => {
    const a = answers[q.id];
    const c = q.choices.find((x) => x.v === a);
    const ratio = (c?.score ?? 0) / (q.weight ?? 1);
    return { dim: q.dim!, ratio };
  })
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2)
    .map((d) => d.dim);
}

export function bandOf(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "準備万端", tone: "text-jade-deep" };
  if (score >= 60) return { label: "あと一歩", tone: "text-blue" };
  if (score >= 40) return { label: "基礎固め中", tone: "text-plum" };
  return { label: "これから", tone: "text-ink-soft" };
}
