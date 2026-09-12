import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findRoute, migrationRoutes } from '@/data/migration-routes';
import { provider } from '@/data/providers';
import { breadcrumbLd, buildMetadata, faqLd, howToLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';
import { routePage } from '@/content/route-page';

/** Настройки подключения показываем сразу: это первое, что ищут на такой странице. */
function ConnCard({
  side,
  who,
  t,
}: {
  side: string;
  who: ReturnType<typeof provider>;
  t: (typeof routePage)[Lang];
}) {
  return (
    <article>
      <span className="route-settings-side">{side}</span>
      <dl>
        <div>
          <dt>{t.server}</dt>
          <dd>{who.host}</dd>
        </div>
        <div>
          <dt>{t.port}</dt>
          <dd>{who.port} · SSL/TLS</dd>
        </div>
        <div>
          <dt>{t.login}</dt>
          <dd>{who.login === 'email' ? t.loginEmail : t.loginLocal}</dd>
        </div>
        <div>
          <dt>{t.password}</dt>
          <dd>{who.appPassword ? t.passwordApp : t.passwordPlain}</dd>
        </div>
      </dl>
    </article>
  );
}

export function migrationRouteMetadata(lang: Lang, slug: string): Metadata {
  const route = findRoute(slug);
  if (!route) return {};
  const copy = route[lang];
  return buildMetadata({
    language: lang,
    path: `/migrate/${slug}`,
    title: copy.title,
    description: copy.description,
  });
}

export function MigrationRoutePage({ lang, slug }: { lang: Lang; slug: string }) {
  const route = findRoute(slug);
  if (!route) return null;
  const copy = route[lang];
  const t = routePage[lang];
  const from = provider(route.source);
  const to = provider(route.destination);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.home, path: href(lang, '/') },
            { name: t.routes, path: href(lang, '/routes') },
            { name: copy.h1, path: href(lang, `/migrate/${slug}`) },
          ]),
          howToLd({
            name: copy.h1,
            description: copy.description,
            steps: [
              {
                name: t.steps.prepSource(from.name),
                text: t.steps.prepSourceText(from.name, from.appPassword),
              },
              {
                name: t.steps.prepDest(to.name),
                text: t.steps.prepDestText(to.name),
              },
              {
                name: t.steps.servers,
                text: t.steps.serversText(from.host, to.host),
              },
              {
                name: t.steps.run,
                text: t.steps.runText,
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
          <ConnCard side={t.from} who={from} t={t} />
          <ConnCard side={t.to} who={to} t={t} />
        </div>

        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta(from.name, to.name)}
            <svg aria-hidden="true">
              <use href="#ar" />
            </svg>
          </a>
        </p>
      </section>

      <section className="shell route-pitfalls">
        <div className="head-wide">
          <h2>
            {t.pitfallsA} <span className="ital">{t.pitfallsB}</span>
          </h2>
        </div>
        <ul>
          {copy.pitfalls.map((item) => (
            <li key={item}>
              <svg aria-hidden="true">
                <use href="#al" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.faqEyebrow}</p>
          <h2>{t.faqTitle}</h2>
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
          <p className="eyebrow">{t.relatedEyebrow}</p>
          <h2>{t.relatedTitle}</h2>
        </div>
        <div className="route-links">
          {migrationRoutes
            .filter((r) => r.slug !== slug)
            .slice(0, 8)
            .map((r) => (
              <a
                key={r.slug}
                className="brief-link"
                href={href(lang, `/migrate/${r.slug}`)}
              >
                {provider(r.source).short} → {provider(r.destination).short}
                <svg aria-hidden="true">
                  <use href="#ar" />
                </svg>
              </a>
            ))}
        </div>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}
