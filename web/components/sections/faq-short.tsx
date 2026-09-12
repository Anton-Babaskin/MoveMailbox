import { faqShort, type FaqItem } from '@/content/sections/faq-short';
import { href, type Lang } from '@/i18n/config';

/** Один вопрос: разметка одинакова у всех, отличается только раскрытие первого. */
function Item({ item, open }: { item: FaqItem; open?: boolean }) {
  return (
    <details open={open}><summary>{item.q}<span className="pm"></span></summary>
      <p>{item.a}</p></details>
  );
}

export function FaqShort({ lang }: { lang: Lang }) {
  const t = faqShort[lang];
  return (
    <>
      <section className="shell">
        <div className="head-wide"><p className="eyebrow">{t.eyebrow}</p><h2>{t.h2}</h2></div>
        <div className="faq">
          <div>
            {t.colA.map((item, i) => <Item key={item.q} item={item} open={i === 0} />)}
          </div>
          <div>
            {t.colB.map((item) => <Item key={item.q} item={item} />)}
          </div>
        </div>
        <p style={{ marginTop: '22px' }}><a className="brief-link" href={href(lang, '/guides')}>{t.allLink}<svg aria-hidden="true"><use href="#ar" /></svg></a></p>
      </section>
    </>
  );
}
