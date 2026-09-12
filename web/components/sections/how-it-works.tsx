import { howItWorks } from '@/content/sections/how-it-works';
import type { Lang } from '@/i18n/config';

export function HowItWorks({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = howItWorks[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  // Шаги идут уровнем ниже заголовка секции: на главной он h2 и шаги h3,
  // на /routes секция даёт h1 странице — тогда шаги поднимаются до h2,
  // иначе в структуре остаётся пропущенный уровень.
  const Step = pageTitle ? 'h2' : 'h3';
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
        </div>
        <div className="flow" id="flow4">
          <div className="rail" aria-hidden="true"><i id="railFill"></i></div>
          <div className="flow-grid">
            <article className="stn">
              <span className="node"><b>01</b></span>
              <div className="body"><span className="tm">{t.s1.tm}</span><Step className="stn-title">{t.s1.h3}</Step>
                <p>{t.s1.p1}<code>993</code>{t.s1.p2}<code>143</code>{t.s1.p3}</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>02</b></span>
              <div className="body"><span className="tm">{t.s2.tm}</span><Step className="stn-title">{t.s2.h3}</Step>
                <p>{t.s2.p}</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>03</b></span>
              <div className="body"><span className="tm">{t.s3.tm}</span><Step className="stn-title">{t.s3.h3}</Step>
                <p>{t.s3.p}</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>04</b></span>
              <div className="body"><span className="tm">{t.s4.tm}</span><Step className="stn-title">{t.s4.h3}</Step>
                <p>{t.s4.p}</p></div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
