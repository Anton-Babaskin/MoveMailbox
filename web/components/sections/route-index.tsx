import { migrationRoutes } from '@/data/migration-routes';
import { provider } from '@/data/providers';

/** Внутренняя перелинковка: без неё 16 страниц маршрутов краулер найдёт нескоро. */
export function RouteIndex() {
  return (
    <section className="shell" id="all-routes">
      <div className="head-wide">
        <p className="eyebrow">Все направления</p>
        <h2>
          Подробный разбор <span className="ital">для каждой пары</span>
        </h2>
        <p className="lede" style={{ marginTop: '16px' }}>
          Хосты, порты, пароли приложений и то, что ломается именно на этой
          паре — по одной странице на маршрут.
        </p>
      </div>
      <div className="error-index">
        {migrationRoutes.map((r) => (
          <a key={r.slug} href={`/migrate/${r.slug}`}>
            <code>
              {provider(r.source).short} → {provider(r.destination).short}
            </code>
            <strong>{r.ru.h1}</strong>
            <span>{r.ru.description}</span>
            <svg>
              <use href="#ar" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
