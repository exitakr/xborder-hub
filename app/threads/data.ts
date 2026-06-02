/**
 * Threads + multi-axis taxonomy shared between the list page (/threads)
 * and the detail page (/thread?id=…). Sample data for now; will be
 * replaced by Supabase queries in Phase 4.
 */

export type Sort = "new" | "popular";

export const COUNTRIES = [
  { v: "sg", label: "🇸🇬 Singapore" },
  { v: "jp", label: "🇯🇵 Japan" },
  { v: "hk", label: "🇭🇰 Hong Kong" },
  { v: "vn", label: "🇻🇳 Vietnam" },
  { v: "th", label: "🇹🇭 Thailand" },
  { v: "us", label: "🇺🇸 United States" },
] as const;

export const INDUSTRIES = [
  { v: "tech", label: "💻 Tech" },
  { v: "finance", label: "🏦 Finance" },
  { v: "startup", label: "🚀 Startup" },
  { v: "consumer", label: "🛍 Consumer" },
  { v: "manufacturing", label: "🏭 Manufacturing" },
] as const;

export const ROLES = [
  { v: "pm", label: "📐 PM" },
  { v: "eng", label: "⚙️ Engineer" },
  { v: "bd", label: "💼 BD / Sales" },
  { v: "marketing", label: "📣 Marketing" },
  { v: "design", label: "🎨 Design" },
] as const;

export const CATEGORIES = [
  { v: "career", label: "💼 キャリア" },
  { v: "life", label: "🏠 生活" },
  { v: "visa", label: "🛂 ビザ" },
  { v: "salary", label: "💰 給与" },
  { v: "family", label: "👨‍👩‍👧 家族" },
  { v: "other", label: "💬 その他" },
] as const;

export const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "新着" },
  { id: "popular", label: "人気" },
];

export type Thread = {
  id: number;
  author: string;
  bg: string;
  text: string;
  location: string;
  posted: string;
  country: string;
  industry: string;
  role: string;
  category: string;
  title: string;
  body: string;
  ups: number;
  downs: number;
  replies: number;
};

export const THREADS: Thread[] = [
  {
    id: 1,
    author: "RN",
    bg: "bg-blue",
    text: "text-cream",
    location: "SIN",
    posted: "2時間前",
    country: "sg",
    industry: "tech",
    role: "eng",
    category: "career",
    title: "SG現地Tech企業の面接、英語だけど日本語訛りでも大丈夫?",
    body: "来月Shopee/Grabの最終面接を控えています。TOEIC900はあるけど発音はバキバキの日本語訛り。皆さんどう乗り越えました?",
    ups: 23,
    downs: 1,
    replies: 14,
  },
  {
    id: 2,
    author: "HK",
    bg: "bg-mustard",
    text: "text-ink",
    location: "SGN",
    posted: "5時間前",
    country: "vn",
    industry: "startup",
    role: "bd",
    category: "family",
    title:
      "子供のインターナショナルスクール、ホーチミンで月いくらかかってますか?",
    body: "日本から移ってきたばかりで、想像の3倍くらい高くて驚いています。皆さんの実例を共有してもらえると助かります。",
    ups: 47,
    downs: 0,
    replies: 28,
  },
  {
    id: 3,
    author: "MS",
    bg: "bg-jade",
    text: "text-ink",
    location: "BKK",
    posted: "昨日",
    country: "th",
    industry: "startup",
    role: "bd",
    category: "visa",
    title: "タイのSmart Visa、起業家枠の最新申請プロセス(2026年版)",
    body: "最近ルールが変わったので備忘録です。総資本金、雇用要件、ローカルパートナーの扱いなど、まとめて書きました。",
    ups: 89,
    downs: 2,
    replies: 42,
  },
  {
    id: 4,
    author: "TM",
    bg: "bg-plum",
    text: "text-cream",
    location: "TYO",
    posted: "2日前",
    country: "sg",
    industry: "tech",
    role: "pm",
    category: "salary",
    title: "東京年収1,200万 vs SG SGD 11k、本当の手取り比較",
    body: "オファーをもらって悩んでいます。SGは税金安いけど家賃高い…リアルな手取りと生活費の差を計算してみました。",
    ups: 156,
    downs: 8,
    replies: 67,
  },
  {
    id: 5,
    author: "SK",
    bg: "bg-blue-soft",
    text: "text-ink",
    location: "SIN",
    posted: "3日前",
    country: "sg",
    industry: "consumer",
    role: "marketing",
    category: "life",
    title: "SGのコンドミニアム、家族で住むなら結局どのエリア?",
    body: "Bukit Timah、East Coast、River Valley…日本人駐在員の定番をまとめました。価格帯と通学のしやすさで分けてます。",
    ups: 72,
    downs: 3,
    replies: 31,
  },
  {
    id: 6,
    author: "AK",
    bg: "bg-ink",
    text: "text-cream",
    location: "SIN",
    posted: "4日前",
    country: "sg",
    industry: "tech",
    role: "pm",
    category: "career",
    title: "外資 PM の評価制度、日系と何がどう違うか",
    body: "OKR や 360 レビューの実際の運用、昇進判定のリアルを共有します。",
    ups: 64,
    downs: 1,
    replies: 22,
  },
  {
    id: 7,
    author: "JN",
    bg: "bg-blue",
    text: "text-cream",
    location: "SFO",
    posted: "5日前",
    country: "us",
    industry: "tech",
    role: "eng",
    category: "visa",
    title: "H1B 抽選を待たずに US Tech に行く方法は本当にあるか",
    body: "L-1B / O-1 / TN(カナダ国籍向け)を実際に取った 3 名の方法をまとめました。",
    ups: 41,
    downs: 0,
    replies: 17,
  },
];

export const LABELS = {
  countries: Object.fromEntries(COUNTRIES.map((c) => [c.v, c.label])),
  industries: Object.fromEntries(INDUSTRIES.map((c) => [c.v, c.label])),
  roles: Object.fromEntries(ROLES.map((c) => [c.v, c.label])),
  categories: Object.fromEntries(CATEGORIES.map((c) => [c.v, c.label])),
};
