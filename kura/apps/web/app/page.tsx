import Link from "next/link";
import { fill, getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { CATEGORIES, CATEGORY_LABEL_KEY } from "@oma/core";
import { ItemPreview, PickerPreview, PortfolioPreview } from "@/components/AppPreview";

/**
 * The page a stranger lands on.
 *
 * Built around pictures of the product rather than claims about it. Someone
 * deciding whether to hand over an email wants to know what they will be
 * looking at, and three sentences of prose cannot answer that as fast as one
 * picture of the portfolio screen. The previews are drawn from the app's own
 * CSS tokens (see AppPreview), so they track the theme and cannot go stale
 * against a palette change the way an exported screenshot would.
 *
 * The free limit and the price come from `@oma/core` and the migration rather
 * than being typed in here, because a marketing page that promises a different
 * number from the one the database enforces is the worst possible bug on this
 * page.
 */
export default async function LandingPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="space-y-16 py-6 sm:space-y-24 sm:py-12">
      {/* Hero: the claim on the left, the thing itself on the right. On a phone
          the picture goes underneath, where it still lands above the fold. */}
      <section className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {t.landingHeadline}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{t.landingSub}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary px-6">
              {t.landingCta}
            </Link>
            <Link href="/login" className="btn-secondary px-6">
              {t.landingLogin}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2" aria-label={t.mkAll}>
            {CATEGORIES.map((c) => (
              <li key={c} className="chip gap-1.5">
                <CategoryGlyph category={c} className="h-4 w-4" />
                {t[CATEGORY_LABEL_KEY[c]]}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-[19rem]">
          <PortfolioPreview label={t.landingShotPortfolio} />
          <p className="mt-2 text-center text-[11px] text-muted">{t.landingShotNote}</p>
        </div>
      </section>

      <Showcase
        title={t.landingPickTitle}
        body={t.landingPickBody}
        preview={<PickerPreview label={t.landingShotPicker} />}
      />

      <Showcase
        title={t.landingTradeTitle}
        body={t.landingTradeBody}
        preview={<ItemPreview label={t.landingShotItem} />}
        reverse
      />

      {/* Provenance as a selling point, not a footnote. It is the one claim
          here a competitor cannot copy by writing better marketing, and the
          people who care about it are the people who stay. */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t.landingPriceTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {t.landingPriceBody}
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {["Scryfall", "Pokémon TCG API", "楽天市場", "eBay Browse"].map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: t.landingF1Title, body: t.landingF1Body },
          { title: t.landingF2Title, body: t.landingF2Body },
          { title: t.landingF3Title, body: t.landingF3Body },
        ].map((f) => (
          <div key={f.title} className="card p-5">
            <h2 className="text-sm font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Stated before signup rather than discovered at item 21. A limit found
          later feels like a trap; the same limit published up front is just a
          plan. */}
      <section className="card border-accent/40 p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t.landingPlanTitle}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {fill(t.landingPlanBody, { max: FREE_HOLDING_LIMIT, price: t.planPrice })}
        </p>
        <Link href="/signup" className="btn-primary mt-6 px-8">
          {t.landingCta}
        </Link>
      </section>
    </div>
  );
}

/**
 * Free-plan ceiling, mirrored from `free_holding_limit()` in migration 0015.
 *
 * Duplicated deliberately: this page renders for signed-out visitors, and
 * asking the database for one integer on every anonymous request — the request
 * most likely to arrive in bulk from a crawler — is not worth it. The migration
 * is the authority; if it changes, this changes with it.
 */
const FREE_HOLDING_LIMIT = 10;

function Showcase({
  title,
  body,
  preview,
  reverse = false,
}: {
  title: string;
  body: string;
  preview: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
      {/* The picture leads on wide screens for alternate rows, giving the page
          a rhythm; on a phone the heading always comes first, because a column
          of unexplained screenshots is not a story. */}
      <div className={reverse ? "sm:order-2" : ""}>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{body}</p>
      </div>
      <div className={`mx-auto w-full max-w-[19rem] ${reverse ? "sm:order-1" : ""}`}>
        {preview}
      </div>
    </section>
  );
}
