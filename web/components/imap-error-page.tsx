import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findError, imapErrors } from '@/data/imap-errors';
import { breadcrumbLd, buildMetadata, faqLd, techArticleLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';
import { errorPage } from '@/content/error-page';

export function imapErrorMetadata(lang: Lang, slug: string): Metadata {
  const err = findError(slug);
  if (!err) return {};
  const copy = err[lang];
  return buildMetadata({
    language: lang,
    path: `/docs/errors/${slug}`,
    title: copy.title,
    description: copy.description,
  });
}

export function ImapErrorPage({ lang, slug }: { lang: Lang; slug: string }) {
  const err = findError(slug);
  if (!err) return null;
  const copy = err[lang];
  const t = errorPage[lang];

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.home, path: href(lang, '/') },
            { name: t.errors, path: href(lang, '/docs/errors') },
            { name: copy.h1, path: href(lang, `/docs/errors/${slug}`) },
          ]),
          techArticleLd({
            headline: copy.h1,
            description: copy.description,
            path: href(lang, `/docs/errors/${slug}`),
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{copy.h1}</h1>
        </div>
        <div className="error-sample">
          <span>
            <svg aria-hidden="true">
              <use href="#tx" />
            </svg>
            {t.sample}
          </span>
          <pre>
            <code>{copy.sample}</code>
          </pre>
        </div>
        <p className="lede" style={{ marginTop: '20px' }}>
          {copy.meaning}
        </p>
      </section>

      <section className="shell">
        <div className="head-wide">
          <h2>
            {t.causesA} <span className="ital">{t.causesB}</span>
          </h2>
        </div>
        <ul className="error-causes">
          {copy.causes.map((cause) => (
            <li key={cause}>
              <svg aria-hidden="true">
                <use href="#al" />
              </svg>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell">
        <div className="head-wide">
          <h2>{t.fixes}</h2>
        </div>
        <ol className="error-fixes">
          {copy.fixes.map((fix) => (
            <li key={fix}>
              <svg aria-hidden="true">
                <use href="#ck" />
              </svg>
              <span>{fix}</span>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta}
            <svg aria-hidden="true">
              <use href="#ar" />
            </svg>
          </a>
        </p>
      </section>

      {copy.faq.length > 0 && (
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
      )}

      <section className="shell">
        <div className="head-wide">
          <h2>{t.others}</h2>
        </div>
        <div className="error-index compact">
          {imapErrors
            .filter((e) => e.slug !== slug)
            .map((e) => (
              <a key={e.slug} href={href(lang, `/docs/errors/${e.slug}`)}>
                <code>{e.code}</code>
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
