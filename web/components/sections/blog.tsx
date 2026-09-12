import { blog } from '@/content/sections/blog';
import type { Lang } from '@/i18n/config';

export function Blog({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = blog[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell" id="blog">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="bgrid">
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#ky" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">{t.p1.tag}</span><span>{t.p1.time}</span></div>
              <h3>{t.p1.h3}</h3>
              <p>{t.p1.text}</p>
              <span className="rd">{t.read}<svg><use href="#ar" /></svg></span>
            </div>
          </a>
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#ml" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">{t.p2.tag}</span><span>{t.p2.time}</span></div>
              <h3>{t.p2.h3}</h3>
              <p>{t.p2.textA}<code>[Gmail]/All Mail</code>{t.p2.textB}</p>
              <span className="rd">{t.read}<svg><use href="#ar" /></svg></span>
            </div>
          </a>
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#sv" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">{t.p3.tag}</span><span>{t.p3.time}</span></div>
              <h3>{t.p3.h3}</h3>
              <p>{t.p3.text}</p>
              <span className="rd">{t.read}<svg><use href="#ar" /></svg></span>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
