/**
 * Rotating daily prompts shown on the home page ("今日の質問"). Picked
 * deterministically by day-of-year so everyone sees the same question on
 * the same date. The 答える CTA prefills /thread/new with the question as
 * the title and the matching category.
 */

export type DailyQuestion = {
  q: string;
  category: "career" | "life" | "visa" | "salary" | "family" | "other";
};

export const DAILY_QUESTIONS: DailyQuestion[] = [
  { q: "海外転職で一番不安だったことは何ですか?", category: "career" },
  { q: "現地での最初の3ヶ月、何が一番大変でしたか?", category: "life" },
  { q: "ビザ申請で「これは知っておきたかった」と思ったことは?", category: "visa" },
  { q: "海外移住して年収はどう変わりましたか?", category: "salary" },
  { q: "家族の反対、どう乗り越えましたか?", category: "family" },
  { q: "英語面接の対策、実際に効いたものは?", category: "career" },
  { q: "現地の家探しで失敗したこと・成功したことは?", category: "life" },
  { q: "海外で働いて「日本の方が良かった」と思うことは?", category: "life" },
  { q: "初めてのオファー交渉、どう進めましたか?", category: "salary" },
  { q: "子どもの学校選び、何を基準にしましたか?", category: "family" },
  { q: "レジュメ(英文履歴書)で工夫したポイントは?", category: "career" },
  { q: "現地の医療、実際どうでしたか?", category: "life" },
  { q: "永住権(PR)取得までのリアルなタイムラインは?", category: "visa" },
  { q: "海外での税金・確定申告、最初に何を調べましたか?", category: "salary" },
  { q: "配偶者のキャリア、移住後どうなりましたか?", category: "family" },
  { q: "LinkedIn 経由の転職、実際うまくいきましたか?", category: "career" },
  { q: "現地で友達を作るのに効いた方法は?", category: "life" },
  { q: "ビザスポンサー付き求人、どうやって見つけましたか?", category: "visa" },
  { q: "生活コストで一番想定外だった出費は?", category: "salary" },
  { q: "親の介護と海外勤務、どう両立していますか?", category: "family" },
  { q: "海外で評価される日本人の強みって何だと思いますか?", category: "career" },
  { q: "帰国か残留か、迷ったときの判断軸は?", category: "career" },
  { q: "現地チームとの文化の違い、一番驚いたことは?", category: "career" },
  { q: "海外就職の情報収集、何が一番役に立ちましたか?", category: "career" },
  { q: "移住前にやっておいて良かった準備は?", category: "life" },
  { q: "現地の銀行口座・クレジットカード、最初の壁は?", category: "life" },
  { q: "ビザ更新のたびに緊張すること、ありますか?", category: "visa" },
  { q: "ストックオプション・RSU、日本と何が違いましたか?", category: "salary" },
  { q: "単身赴任と家族帯同、選んだ理由は?", category: "family" },
  { q: "今の国を選んだ決め手は何でしたか?", category: "career" },
];

/** Deterministic pick for a given date — same question for everyone all day. */
export function questionForDate(d: Date): DailyQuestion {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000);
  return DAILY_QUESTIONS[(d.getFullYear() * 366 + day) % DAILY_QUESTIONS.length]!;
}
