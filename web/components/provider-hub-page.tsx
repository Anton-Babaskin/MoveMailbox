import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findProviderHub } from '@/data/provider-hubs';
import { migrationRoutes } from '@/data/migration-routes';
import { provider, providers } from '@/data/providers';
import { breadcrumbLd, buildMetadata, faqLd, howToLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';
import { providerHubPage } from '@/content/provider-hub-page';

/**
 * Страница одного провайдера: /migrate/gmail и такие же.
 *
 * Сюда приходят по запросу про один сервис, когда вторая сторона ещё не
 * выбрана. Поэтому структура другая, чем у маршрута A → B: настройки одной
 * стороны, её собственные ловушки и список направлений, куда отсюда уходят.
 */
export function providerHubMetadata(lang: Lang, slug: string): Metadata {
  const hub = findProviderHub(slug);
  if (!hub) return {};
  const copy = hub[lang];
  return buildMetadata({
    language: lang,
    path: `/migrate/${slug}`,
    title: copy.title,
    description: copy.description,
    ogType: 'article',
  });
}

export function ProviderHubPage({ lang, slug }: { lang: Lang; slug: string }) {
  const hub = findProviderHub(slug);
  if (!hub) return null;
  const copy = hub[lang];
  const t = providerHubPage[lang];
  const who = hub.provider ? provider(hub.provider) : null;
  const name = who ? who.name : 'IMAP';

  /* Маршруты, где этот провайдер с любой стороны. Для общей IMAP-страницы
     показываем основные направления: там вторая сторона всегда «любой сервер». */
  const related = (
    hub.provider
      ? migrationRoutes.filter(
          (route) => route.source === hub.provider || route.destination === hub.provider,
        )
      : migrationRoutes.filter((route) => route.tier === 1)
  ).slice(0, 6);

  /* Строки таблицы: у известного провайдера — его настройки из справочника,
     у общей IMAP-страницы — объяснение, где эти значения взять. */
  const settingsRows: Array<[string, string]> = who
    ? [
        [t.rowServer, who.host],
        [t.rowPort, `${who.port} · SSL/TLS`],
        [t.rowLogin, who.login === 'email' ? t.loginEmail : t.loginLocal],
        [t.rowPassword, who.appPassword ? t.passwordApp : t.passwordPlain],
      ]
    : [...t.genericRows];

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: lang === 'en' ? 'Home' : lang === 'uk' ? 'Головна' : 'Главная', path: href(lang, '/') },
            { name: t.routesAll, path: href(lang, '/routes') },
            { name: copy.h1, path: href(lang, `/migrate/${slug}`) },
          ]),
          howToLd({
            name: copy.h1,
            description: copy.description,
            steps: [
              { name: t.steps.check, text: t.steps.checkText(name, who ? who.appPassword : false) },
              { name: t.steps.dest, text: t.steps.destText },
              { name: t.steps.folders, text: t.steps.foldersText },
              { name: t.steps.run, text: t.steps.runText },
            ],
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow} · {name}</p>
          <h1>{copy.h1}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>{copy.intro}</p>
        </div>

        <div className="hub-settings">
          <h2>{who ? t.settingsTitle : t.genericTitle}</h2>
          <p className="hub-settings-lede">{who ? t.settingsLede : t.genericLede}</p>
          <dl>
            {settingsRows.map(([term, value]) => (
              <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </div>

        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta(name)}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
        </p>
      </section>

      <section className="shell route-pitfalls">
        <div className="head-wide">
          <h2>{t.pitfallsA} <span className="ital">{t.pitfallsB}</span></h2>
        </div>
        <ul>
          {copy.pitfalls.map((item) => (
            <li key={item}>
              <svg aria-hidden="true"><use href="#al" /></svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="shell">
          <div className="head-wide">
            <h2>{t.routesTitle}</h2>
            <p className="lede" style={{ marginTop: '14px' }}>{t.routesLede}</p>
          </div>
          <div className="rgrid">
            {related.map((route) => (
              <a className="rt" key={route.slug} href={href(lang, `/migrate/${route.slug}`)}>
                <span>{providers[route.source].short}</span>
                <svg aria-hidden="true" className="a"><use href="#ar" /></svg>
                <span>{providers[route.destination].short}</span>
                <span className="go">{route[lang].h1}</span>
              </a>
            ))}
          </div>
          <p style={{ marginTop: '20px' }}>
            <a className="brief-link" href={href(lang, '/routes')}>
              {t.routesAll}
              <svg aria-hidden="true"><use href="#ar" /></svg>
            </a>
          </p>
        </section>
      )}

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.faqEyebrow}</p>
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="faq">
          <div>
            {copy.faq.filter((_, i) => i % 2 === 0).map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}<span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div>
            {copy.faq.filter((_, i) => i % 2 === 1).map(([q, a]) => (
              <details key={q}>
                <summary>{q}<span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}
