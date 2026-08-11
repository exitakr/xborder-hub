/**
 * Screenshots of the app, drawn rather than captured.
 *
 * A real screenshot would be the obvious thing, and it is the wrong thing here:
 * it is a PNG that has to be re-exported on every design change, it ships one
 * theme onto a page that has two, it carries whatever numbers happened to be in
 * the account that took it, and it goes blurry on the displays this page is
 * mostly read on. These are built from the same CSS tokens as the real screens,
 * so they follow light/dark automatically and cannot drift out of date visually
 * while the palette moves underneath them.
 *
 * The figures are illustrative and are labelled as such by the caller. They are
 * shaped like a real portfolio — a mix of gains and losses, one item with no
 * price — rather than a flattering fiction where everything is up.
 */

/** Phone-shaped frame. `aria-hidden` throughout: the prose beside it says what it shows. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-2xl border border-line bg-canvas shadow-sm"
    >
      {children}
    </div>
  );
}

function Bar() {
  return (
    <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
      <span className="text-[10px] font-semibold tracking-tight">Oh My Asset</span>
      <span className="flex gap-1">
        <i className="block h-1 w-4 rounded-full bg-line" />
        <i className="block h-1 w-4 rounded-full bg-line" />
      </span>
    </div>
  );
}

/** The portfolio screen: total, chart, holdings. The thing people screenshot. */
export function PortfolioPreview({ label }: { label: string }) {
  return (
    <Frame>
      <Bar />
      <div className="space-y-2 p-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-[9px] text-muted">{label}</p>
          <p className="tnum text-2xl font-bold leading-tight">¥3,482,600</p>
          <p className="tnum text-[10px] font-semibold text-gain">+¥412,300 (+13.4%)</p>

          <Sparkline />

          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2">
            {[
              ["¥3,070,300", ""],
              ["+¥88,000", "text-gain"],
              ["12", ""],
            ].map(([v, tone], i) => (
              <div key={i}>
                <p className="h-1 w-6 rounded-full bg-line" />
                <p className={`tnum mt-1 text-[10px] font-semibold ${tone}`}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {[
          ["¥1,240,000", "+8.2%", "text-gain"],
          ["¥862,000", "−3.1%", "text-loss"],
          ["¥415,500", "+21.7%", "text-gain"],
        ].map(([value, pct, tone], i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2">
            <div className="h-7 w-7 shrink-0 rounded bg-line/70" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="h-1.5 w-20 rounded-full bg-line" />
              <p className="h-1 w-12 rounded-full bg-line/60" />
            </div>
            <div className="text-right">
              <p className="tnum text-[10px] font-semibold">{value}</p>
              <p className={`tnum text-[9px] ${tone}`}>{pct}</p>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/**
 * The item picker: type a name, get pictures and prices back.
 *
 * This is the screen worth showing a stranger, because it is the one that
 * explains what the app does in less time than a sentence could.
 */
export function PickerPreview({ label }: { label: string }) {
  return (
    <Frame>
      <Bar />
      <div className="space-y-2 p-3">
        <div className="rounded-lg border border-accent bg-surface px-2.5 py-2">
          <p className="text-[10px] text-ink">
            {label}
            <span className="ml-0.5 inline-block h-2.5 w-px animate-pulse bg-accent align-middle" />
          </p>
        </div>

        {[
          ["¥182,000", true],
          ["¥94,500", true],
          ["データ不足", false],
        ].map(([price, priced], i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2"
          >
            {/* A card-shaped block: the artwork is the point of this row. */}
            <div className="h-9 w-7 shrink-0 rounded bg-gradient-to-br from-accent/30 to-accent/5" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="h-1.5 w-24 rounded-full bg-line" />
              <p className="h-1 w-14 rounded-full bg-line/60" />
            </div>
            <p
              className={`tnum shrink-0 text-[10px] ${
                priced ? "font-semibold" : "text-muted"
              }`}
            >
              {price}
            </p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** The item screen: price history with your own trades marked on it. */
export function ItemPreview({ label }: { label: string }) {
  return (
    <Frame>
      <Bar />
      <div className="p-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-start gap-2">
            <div className="h-12 w-9 shrink-0 rounded bg-gradient-to-br from-accent/30 to-accent/5" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="h-1.5 w-24 rounded-full bg-line" />
              <p className="tnum text-lg font-bold leading-none">¥182,000</p>
              <p className="text-[9px] text-muted">{label}</p>
            </div>
          </div>

          <TradeChart />
        </div>
      </div>
    </Frame>
  );
}

/** Rising area, matching the real chart's fill-under-line treatment. */
function Sparkline() {
  return (
    <svg viewBox="0 0 200 56" className="mt-2 h-14 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="oma-preview-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-gain))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="rgb(var(--c-gain))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 44 L28 40 L56 46 L84 30 L112 34 L140 18 L168 22 L200 8 L200 56 L0 56 Z"
        fill="url(#oma-preview-fill)"
      />
      <path
        d="M0 44 L28 40 L56 46 L84 30 L112 34 L140 18 L168 22 L200 8"
        fill="none"
        stroke="rgb(var(--c-gain))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Price line with a buy and a sell marked on it — the feature, in one picture. */
function TradeChart() {
  return (
    <svg viewBox="0 0 200 70" className="mt-3 h-20 w-full" preserveAspectRatio="none">
      <path
        d="M0 52 L25 48 L50 56 L75 38 L100 42 L125 24 L150 30 L175 16 L200 12"
        fill="none"
        stroke="rgb(var(--c-accent))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Buy, then sell — placed on the line, at the prices they happened at. */}
      <circle cx="50" cy="56" r="7" fill="rgb(var(--c-buy))" />
      <text x="50" y="59" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
        B
      </text>
      <circle cx="175" cy="16" r="7" fill="rgb(var(--c-sell))" />
      <text x="175" y="19" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
        S
      </text>
    </svg>
  );
}
