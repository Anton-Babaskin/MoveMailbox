import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findImapHost, imapHosts, type ImapHost } from '@/data/imap-hosts';
import { imapHostPage, imapIndexPage } from '@/content/imap-host-page';
import { breadcrumbLd, buildMetadata, faqLd, techArticleLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';

/**
 * Страница настроек одного сервиса: /imap/ukr-net и такие же.
 *
 * Запрос сюда приходит не «перенести почту», а «какой у этого сервиса
 * IMAP-хост». Поэтому первым экраном идёт таблица, а не рассказ: человек
 * пришёл за четырьмя значениями и уйдёт, как только их увидит. Всё
 * остальное — ловушки, вопросы и переход к переносу — ниже, для тех, кому
 * настройки не помогли.
 */
export function imapHostMetadata(lang: Lang, slug: string): Metadata {
  const host = findImapHost(slug);
  if (!host) return {};
  const copy = host[lang];
  return buildMetadata({
    language: lang,
    path: `/imap/${slug}`,
    title: copy.title,
    description: copy.description,
    ogType: 'article',
  });
}

function SettingsTable({ host, lang }: { host: ImapHost; lang: Lang }) {
  const t = imapHostPage[lang];
  const password =
    host.auth === 'app-password'
      ? t.passwordApp
      : host.auth === 'bridge'
        ? t.passwordBridge
        : t.passwordPlain;

  const rows: Array<[string, string]> = host.imap
    ? [
        [t.rowServer, host.imap.host],
        [t.rowPort, String(host.imap.port)],
        [t.rowSecurity, host.imap.security],
        [t.rowLogin, host.login === 'email' ? t.loginEmail : t.loginLocal],
        [t.rowPassword, password],
      ]
    : [];

  return (
    <dl>
      {rows.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ImapHostPage({ lang, slug }: { lang: Lang; slug: string }) {
  const host = findImapHost(slug);
  if (!host) return null;
  const copy = host[lang];
  const t = imapHostPage[lang];
  const path = `/imap/${slug}`;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.home, path: href(lang, '/') },
            { name: t.indexTitle, path: href(lang, '/imap') },
            { name: copy.h1, path: href(lang, path) },
          ]),
          techArticleLd({
            headline: copy.h1,
            description: copy.description,
            path: href(lang, path),
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow} · {host.domains.join(' · ')}</p>
          <h1>{copy.h1}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>{copy.intro}</p>
        </div>

        <div className="hub-settings">
          <h2>{host.imap ? t.settingsTitle : t.noImapTitle}</h2>
          <SettingsTable host={host} lang={lang} />
          {host.smtp && (
            <>
              <h2 style={{ marginTop: '24px' }}>{t.smtpTitle}</h2>
              <dl>
                <div><dt>{t.rowServer}</dt><dd>{host.smtp.host}</dd></div>
                <div><dt>{t.rowPort}</dt><dd>{String(host.smtp.port)}</dd></div>
                <div><dt>{t.rowSecurity}</dt><dd>{host.smtp.security}</dd></div>
              </dl>
            </>
          )}
          {/* Откуда значения. Без этой строки таблица ничем не отличается от
              сотни перепечаток друг у друга, половина которых устарела. */}
          <p className="hub-settings-lede" style={{ marginTop: '16px' }}>
            {t.checkedNote(host.checked)}{' '}
            {t.sourceLabel}:{' '}
            {host.sources.map((src, i) => (
              <span key={src}>
                {i > 0 && ', '}
                <a href={src} rel="nofollow noopener external" target="_blank">
                  {new URL(src).hostname}
                </a>
              </span>
            ))}
          </p>
        </div>

        {host.exportHost && (
          <div className="hub-settings" style={{ marginTop: '18px' }}>
            <h2>{t.exportTitle}</h2>
            <p className="hub-settings-lede">{t.exportText(host.exportHost)}</p>
          </div>
        )}

        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta(host.name)}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
        </p>
      </section>

      <section className="shell route-pitfalls">
        <div className="head-wide">
          <h2>{t.pitfallsA}<span className="ital">{t.pitfallsB}</span></h2>
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
        <p style={{ marginTop: '20px', display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
          <a className="brief-link" href={href(lang, '/imap')}>
            {t.allHosts}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
          <a className="brief-link" href={href(lang, '/guides')}>
            {t.guides}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
          <a className="brief-link" href={href(lang, '/docs/errors')}>
            {t.errors}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
        </p>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}

/** Витрина раздела: /imap. Отсюда уходят ссылки на все страницы настроек. */
export function ImapIndexPage({ lang }: { lang: Lang }) {
  const t = imapIndexPage[lang];
  const s = imapHostPage[lang];

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: s.home, path: href(lang, '/') },
            { name: s.indexTitle, path: href(lang, '/imap') },
          ]),
        ]}
      />
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.h1}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>

        <div className="error-index" style={{ marginTop: '30px' }}>
          {imapHosts.map((host) => (
            <a key={host.slug} href={href(lang, `/imap/${host.slug}`)}>
              <code>{host.imap ? host.imap.host : '—'}</code>
              <strong>{host.name}</strong>
              <span>{host[lang].description}</span>
              <svg aria-hidden="true"><use href="#ar" /></svg>
            </a>
          ))}
        </div>

        <p style={{ marginTop: '24px', display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
          <a className="brief-link" href={href(lang, '/guides')}>
            {s.guides}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
          <a className="brief-link" href={href(lang, '/docs/errors')}>
            {s.errors}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
        </p>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}
