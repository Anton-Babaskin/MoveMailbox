import { business } from '@/content/sections/business';
import type { Lang } from '@/i18n/config';

export function Business({ lang }: { lang: Lang }) {
  const t = business[lang];
  return (
    <>
      <section className="shell">
        <div className="biz">
          <span className="ico"><svg style={{ width: '24px', height: '24px' }}><use href="#bs" /></svg></span>
          <div>
            <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
            <p>{t.text}</p>
          </div>
          <a className="btn btn-p" href="https://github.com/Anton-Babaskin/MoveMailbox/issues" target="_blank" rel="noreferrer">{t.cta}<svg style={{ width: '15px', height: '15px' }}><use href="#ar" /></svg></a>
        </div>
      </section>
    </>
  );
}
