import { finalCta } from '@/content/sections/final-cta';
import { href, type Lang } from '@/i18n/config';

export function FinalCta({ lang }: { lang: Lang }) {
  const t = finalCta[lang];
  return (
    <>
      <section className="shell final">
        <span className="ico"><svg aria-hidden="true" style={{ width: '24px', height: '24px' }}><use href="#ht" /></svg></span>
        <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
        <p className="lede" style={{ textAlign: 'center' }}>{t.lede}</p>
        <div className="btns">
          <a className="btn btn-p" href={href(lang, '/')}>{t.start}<svg aria-hidden="true" style={{ width: '16px', height: '16px' }}><use href="#ar" /></svg></a>
          <a className="btn btn-g" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg aria-hidden="true" style={{ width: '16px', height: '16px' }}><use href="#dl" /></svg>{t.download}</a>
        </div>
        <small>{t.small}</small>
      </section>
    </>
  );
}
