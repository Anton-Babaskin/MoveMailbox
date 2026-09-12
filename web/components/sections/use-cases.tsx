import { useCases } from '@/content/sections/use-cases';
import type { Lang } from '@/i18n/config';

export function UseCases({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = useCases[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
        </div>
        <div className="who-grid">
          <article className="who">
            <span className="who-n">01</span>
            <h3>{t.w1.h3}</h3>
            <p>{t.w1.text}</p>
            <span className="who-tag">{t.w1.tag}</span>
          </article>
          <article className="who">
            <span className="who-n">02</span>
            <h3>{t.w2.h3}</h3>
            <p>{t.w2.text}</p>
            <span className="who-tag">{t.w2.tag}</span>
          </article>
          <article className="who">
            <span className="who-n">03</span>
            <h3>{t.w3.h3}</h3>
            <p>{t.w3.text}</p>
            <span className="who-tag">{t.w3.tag}</span>
          </article>
        </div>
        <div className="proof">
          <div><strong>{t.proof1title}</strong><span>{t.proof1}</span></div>
          <div><strong>imapsync</strong><span>{t.proof2}</span></div>
          <div><strong>{t.proof3title}</strong><span>{t.proof3}</span></div>
          <div><strong>Self-hosted</strong><span>{t.proof4}</span></div>
        </div>
      </section>
    </>
  );
}
