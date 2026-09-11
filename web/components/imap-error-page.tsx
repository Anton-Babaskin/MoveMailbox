import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findError, imapErrors } from '@/data/imap-errors';
import { breadcrumbLd, faqLd, SITE_NAME, techArticleLd } from '@/lib/seo';

export function imapErrorMetadata(slug: string): Metadata {
  const err = findError(slug);
  if (!err) return {};
  return {
    title: err.ru.title,
    description: err.ru.description,
    alternates: { canonical: `/docs/errors/${slug}/` },
    openGraph: {
      type: 'article',
      title: err.ru.title,
      description: err.ru.description,
      url: `/docs/errors/${slug}/`,
      siteName: SITE_NAME,
    },
  };
}

export function ImapErrorPage({ slug }: { slug: string }) {
  const err = findError(slug);
  if (!err) return null;
  const copy = err.ru;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: 'Главная', path: '/' },
            { name: 'Ошибки', path: '/docs/errors/' },
            { name: copy.h1, path: `/docs/errors/${slug}/` },
          ]),
          techArticleLd({
            headline: copy.h1,
            description: copy.description,
            path: `/docs/errors/${slug}/`,
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">Диагностика IMAP</p>
          <h1>{copy.h1}</h1>
        </div>
        <div className="error-sample">
          <span>
            <svg>
              <use href="#tx" />
            </svg>
            Как выглядит в журнале
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
            Причины, <span className="ital">по убыванию вероятности</span>
          </h2>
        </div>
        <ul className="error-causes">
          {copy.causes.map((cause) => (
            <li key={cause}>
              <svg>
                <use href="#al" />
              </svg>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell">
        <div className="head-wide">
          <h2>Что сделать</h2>
        </div>
        <ol className="error-fixes">
          {copy.fixes.map((fix) => (
            <li key={fix}>
              <svg>
                <use href="#ck" />
              </svg>
              <span>{fix}</span>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href="/#workspace">
            Проверить подключение в MoveMailbox
            <svg>
              <use href="#ar" />
            </svg>
          </a>
        </p>
      </section>

      {copy.faq.length > 0 && (
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
      )}

      <section className="shell">
        <div className="head-wide">
          <h2>Другие ошибки</h2>
        </div>
        <div className="error-index compact">
          {imapErrors
            .filter((e) => e.slug !== slug)
            .map((e) => (
              <a key={e.slug} href={`/docs/errors/${e.slug}`}>
                <code>{e.code}</code>
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
