import Link from "next/link";
import { getDict } from "@kura/core";
import { getLocale } from "@/lib/i18n-server";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { CATEGORIES, CATEGORY_LABEL_KEY } from "@kura/core";

export default async function LandingPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  const features = [
    { title: t.landingF1Title, body: t.landingF1Body },
    { title: t.landingF2Title, body: t.landingF2Body },
    { title: t.landingF3Title, body: t.landingF3Body },
  ];

  return (
    <div className="py-6 sm:py-12">
      <section className="max-w-2xl">
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
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-5">
            <h2 className="text-sm font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
