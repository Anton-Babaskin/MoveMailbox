import { errors, type ErrorPart } from '@/content/sections/errors';
import type { Lang } from '@/i18n/config';

/** Абзац из кусков: обычный текст и inline-<code>. */
function parts(items: readonly ErrorPart[]) {
  return items.map((part, i) =>
    typeof part === 'string' ? part : <code key={i}>{part.code}</code>,
  );
}

export function Errors({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = errors[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell" id="errors">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="errs">
          {t.items.map((item, i) => (
            <details className="err" key={item.code} open={i === 0}>
              <summary><code className="e">{item.code}</code><b>{item.title}</b><svg className="chev"><use href="#cv" /></svg></summary>
              <div className="err-in">
                <p>{parts(item.body)}</p>
                <div className="fix"><svg><use href="#ck" /></svg><span><b>{item.fixLabel}</b>{parts(item.fix)}</span></div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
