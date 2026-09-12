import { hero } from '@/content/sections/hero';
import type { Lang } from '@/i18n/config';

export function Hero({ lang }: { lang: Lang }) {
  const t = hero[lang];
  return (
    <>
      <section className="hero shell">
        <span className="badge fade-up" style={{ animationDelay: '.02s' }}><i></i>{t.badge}</span>
        <h1 className="fade-up" style={{ animationDelay: '.08s' }}>{t.h1a}<br /><span className="ital">{t.h1b}</span></h1>
        <p className="hero-sub fade-up" style={{ animationDelay: '.14s' }}>{t.sub}</p>
      </section>
    </>
  );
}
