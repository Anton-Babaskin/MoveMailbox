import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findRoute, migrationRoutes } from '@/data/migration-routes';
import { provider } from '@/data/providers';
import { breadcrumbLd, faqLd, howToLd, SITE_NAME } from '@/lib/seo';

/** Настройки подключения показываем сразу: это первое, что ищут на такой странице. */
function ConnCard({ side, who }: { side: string; who: ReturnType<typeof provider> }) {
  return (
    <article>
      <span className="route-settings-side">{side}</span>
      <dl>
        <div>
          <dt>Сервер IMAP</dt>
          <dd>{who.host}</dd>
        </div>
        <div>
          <dt>Порт</dt>
          <dd>{who.port} · SSL/TLS</dd>
        </div>
        <div>
          <dt>Логин</dt>
          <dd>{who.login === 'email' ? 'полный адрес' : 'часть до @'}</dd>
        </div>
        <div>
          <dt>Пароль</dt>
          <dd>{who.appPassword ? 'пароль приложения' : 'пароль от ящика'}</dd>
        </div>
      </dl>
    </article>
  );
}

export function migrationRouteMetadata(slug: string): Metadata {
  const route = findRoute(slug);
  if (!route) return {};
  return {
    title: route.ru.title,
    description: route.ru.description,
    alternates: { canonical: `/migrate/${slug}/` },
    openGraph: {
      type: 'article',
      title: route.ru.title,
      description: route.ru.description,
      url: `/migrate/${slug}/`,
      siteName: SITE_NAME,
    },
  };
}

export function MigrationRoutePage({ slug }: { slug: string }) {
  const route = findRoute(slug);
  if (!route) return null;
  const copy = route.ru;
  const from = provider(route.source);
  const to = provider(route.destination);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Главная', path: '/' },
            { name: 'Маршруты', path: '/routes/' },
            { name: copy.h1, path: `/migrate/${slug}/` },
          ]),
          howToLd({
            name: copy.h1,
            description: copy.description,
            steps: [
              {
                name: `Подготовить ${from.name}`,
                text: `Включите IMAP и создайте пароль${from.appPassword ? ' приложения' : ''} в ${from.name}.`,
              },
              {
                name: `Подготовить ${to.name}`,
                text: `Создайте ящик в ${to.name} и убедитесь, что места хватает под весь объём.`,
              },
              {
                name: 'Указать серверы',
                text: `Источник — ${from.host}:993, назначение — ${to.host}:993, оба по SSL/TLS.`,
              },
              {
                name: 'Запустить и сверить',
                text: 'Замерьте объём, запустите перенос и сверьте счётчики писем по папкам.',
              },
            ],
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">
            {from.name} → {to.name}
          </p>
          <h1>{copy.h1}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>
            {copy.intro}
          </p>
        </div>

        <div className="route-settings-grid">
          <ConnCard side="ОТКУДА" who={from} />
          <ConnCard side="КУДА" who={to} />
        </div>

        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href="/#workspace">
            Перенести {from.name} → {to.name}
            <svg>
              <use href="#ar" />
            </svg>
          </a>
        </p>
      </section>

      <section className="shell route-pitfalls">
        <div className="head-wide">
          <h2>
            Что ломает перенос <span className="ital">именно на этой паре</span>
          </h2>
        </div>
        <ul>
          {copy.pitfalls.map((item) => (
            <li key={item}>
              <svg>
                <use href="#al" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">FAQ</p>
          <h2>Частые вопросы</h2>
        </div>
        <div className="faq">
          <div>
            {copy.faq
              .filter((_, i) => i % 2 === 0)
              .map(([q, a], i) => (
                <details key={q} open={i === 0}>
                  <summary>
                    {q}
                    <span className="pm" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
          </div>
          <div>
            {copy.faq
              .filter((_, i) => i % 2 === 1)
              .map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span className="pm" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
          </div>
        </div>
      </section>

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">Смежные маршруты</p>
          <h2>Другие направления</h2>
        </div>
        <div className="route-links">
          {migrationRoutes
            .filter((r) => r.slug !== slug)
            .slice(0, 8)
            .map((r) => (
              <a key={r.slug} className="brief-link" href={`/migrate/${r.slug}`}>
                {provider(r.source).short} → {provider(r.destination).short}
                <svg>
                  <use href="#ar" />
                </svg>
              </a>
            ))}
        </div>
      </section>

      <FinalCta />
    </main>
  );
}
