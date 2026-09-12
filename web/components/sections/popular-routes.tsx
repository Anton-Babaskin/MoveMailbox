import { popularRoutes } from '@/content/sections/popular-routes';
import { href, type Lang } from '@/i18n/config';

export function PopularRoutes({ lang }: { lang: Lang }) {
  const t = popularRoutes[lang];
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="rgrid">
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria1}><span>Gmail</span><svg className="a"><use href="#ar" /></svg><span>Outlook</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria2}><span>Outlook</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria3}><span>Yahoo Mail</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria4}><span>iCloud Mail</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria5}><span>cPanel</span><svg className="a"><use href="#ar" /></svg><span>Microsoft 365</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria6}><span>{t.yandex}</span><svg className="a"><use href="#ar" /></svg><span>Zoho</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/routes')} aria-label={t.aria7}><span>{t.oldHost}</span><svg className="a"><use href="#ar" /></svg><span>{t.newHost}</span><span className="go">{t.guide}</span></a>
          <a className="rt" href="#workspace"><span>{t.any}</span><svg className="a"><use href="#ar" /></svg><span>{t.any}</span><span className="go">{t.manual}</span></a>
        </div>
      </section>
    </>
  );
}
