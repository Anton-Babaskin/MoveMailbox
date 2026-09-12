import { pricing } from '@/content/sections/pricing';
import type { Lang } from '@/i18n/config';

export function Pricing({ lang }: { lang: Lang }) {
  const t = pricing[lang];
  return (
    <>
      <section className="shell" id="pricing">
        <p className="keep">{t.plannedNotice}</p>
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="pgrid">
          <article className="pl">
            <div className="pl-t"><strong>{t.free.name}</strong><span>{t.free.tag}</span></div>
            <div className="amt">{t.free.amount}</div><span className="lim">{t.free.lim}</span><small className="nt">{t.free.nt}</small>
            <ul><li><svg><use href="#ck" /></svg>{t.free.ticks[0]}</li><li><svg><use href="#ck" /></svg>{t.free.ticks[1]}</li><li><svg><use href="#ck" /></svg>{t.free.ticks[2]}</li></ul>
          </article>
          <article className="pl on">
            <div className="pl-t"><strong>{t.standard.name}</strong><span>{t.standard.tag}</span></div>
            <div className="amt">{t.standard.amount}<em>{t.standard.per}</em></div><span className="lim">{t.standard.lim}</span><small className="nt">{t.standard.nt}</small>
            <ul><li><svg><use href="#ck" /></svg>{t.standard.ticks[0]}</li><li><svg><use href="#ck" /></svg>{t.standard.ticks[1]}</li><li><svg><use href="#ck" /></svg>{t.standard.ticks[2]}</li></ul>
          </article>
          <article className="pl">
            <div className="pl-t"><strong>{t.large.name}</strong><span>{t.large.tag}</span></div>
            <div className="amt">{t.large.amount}<em>{t.large.per}</em></div><span className="lim">{t.large.lim}</span><small className="nt">{t.large.nt}</small>
            <ul><li><svg><use href="#ck" /></svg>{t.large.ticks[0]}</li><li><svg><use href="#ck" /></svg>{t.large.ticks[1]}</li><li><svg><use href="#ck" /></svg>{t.large.ticks[2]}</li></ul>
          </article>
          <article className="pl">
            <div className="pl-t"><strong>{t.business.name}</strong><span>{t.business.tag}</span></div>
            <div className="amt">{t.business.amount}</div><span className="lim">{t.business.lim}</span><small className="nt">{t.business.nt}</small>
            <ul><li><svg><use href="#ck" /></svg>{t.business.ticks[0]}</li><li><svg><use href="#ck" /></svg>{t.business.ticks[1]}</li><li><svg><use href="#ck" /></svg>{t.business.ticks[2]}</li></ul>
          </article>
        </div>
      </section>
    </>
  );
}
