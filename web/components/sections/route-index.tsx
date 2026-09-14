import { migrationRoutes } from '@/data/migration-routes';
import { RouteMarks } from '@/components/provider-mark';
import { routeIndex } from '@/content/sections/route-index';
import { href, type Lang } from '@/i18n/config';

/** Внутренняя перелинковка: без неё 16 страниц маршрутов краулер найдёт нескоро. */
export function RouteIndex({ lang }: { lang: Lang }) {
  const t = routeIndex[lang];
  return (
    <section className="shell" id="all-routes" data-fx="deal">
      <div className="head-wide" data-fx-head>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>
          {t.h2a}<span className="ital">{t.h2b}</span>
        </h2>
        <p className="lede" style={{ marginTop: '16px' }}>
          {t.lede}
        </p>
      </div>
      {/* Раньше сторона маршрута была моноширинной плашкой «Gmail → Outlook».
          Она читалась как код, а не как «из этого сервиса в тот», и шестнадцать
          таких строк подряд сливались в список. Теперь пара значков: сервис
          виден с одного взгляда, а название маршрута остаётся текстом. */}
      <div className="route-grid" data-fx-items>
        {migrationRoutes.map((r) => (
          <a key={r.slug} className="route-row" href={href(lang, `/migrate/${r.slug}`)}>
            <RouteMarks from={r.source} to={r.destination} />
            <span className="route-txt">
              <strong>{r[lang].h1}</strong>
              <span>{r[lang].description}</span>
            </span>
            <svg className="route-ar" aria-hidden="true">
              <use href="#ar" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
