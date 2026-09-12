import { migrationRoutes } from '@/data/migration-routes';
import { provider } from '@/data/providers';
import { routeIndex } from '@/content/sections/route-index';
import { href, type Lang } from '@/i18n/config';

/** Внутренняя перелинковка: без неё 16 страниц маршрутов краулер найдёт нескоро. */
export function RouteIndex({ lang }: { lang: Lang }) {
  const t = routeIndex[lang];
  return (
    <section className="shell" id="all-routes">
      <div className="head-wide">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>
          {t.h2a}<span className="ital">{t.h2b}</span>
        </h2>
        <p className="lede" style={{ marginTop: '16px' }}>
          {t.lede}
        </p>
      </div>
      <div className="error-index">
        {migrationRoutes.map((r) => (
          <a key={r.slug} href={href(lang, `/migrate/${r.slug}`)}>
            <code>
              {provider(r.source).short} → {provider(r.destination).short}
            </code>
            <strong>{r[lang].h1}</strong>
            <span>{r[lang].description}</span>
            <svg aria-hidden="true">
              <use href="#ar" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
