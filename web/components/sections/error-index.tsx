import { imapErrors } from '@/data/imap-errors';
import { errorIndex } from '@/content/sections/error-index';
import { href, type Lang } from '@/i18n/config';

export function ErrorIndex({ lang }: { lang: Lang }) {
  const t = errorIndex[lang];
  return (
    <section className="shell" id="all-errors">
      <div className="head-wide">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>
          {t.h2a}<span className="ital">{t.h2b}</span>
        </h2>
      </div>
      <div className="error-index">
        {imapErrors.map((e) => (
          <a key={e.slug} href={href(lang, `/docs/errors/${e.slug}`)}>
            <code>{e.code}</code>
            <strong>{e[lang].h1}</strong>
            <span>{e[lang].description}</span>
            <svg aria-hidden="true">
              <use href="#ar" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
