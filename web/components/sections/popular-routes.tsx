import { popularRoutes } from '@/content/sections/popular-routes';
import { ProviderMark } from '@/components/provider-mark';
import { href, type Lang } from '@/i18n/config';

/** Каждая карточка ведёт на свою страницу маршрута, а не в общий каталог:
 *  раньше все восемь вели на /routes, и подпись карточки расходилась с тем,
 *  что открывалось. Подписи и слаги здесь обязаны совпадать. */
export function PopularRoutes({ lang }: { lang: Lang }) {
  const t = popularRoutes[lang];
  return (
    <>
      <section className="shell" data-fx="tiles">
        <div className="head-wide" data-fx-head>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="rgrid" data-fx-items>
          <a className="rt" href={href(lang, '/migrate/gmail-to-outlook')} aria-label={t.aria1}><ProviderMark provider="gmail" /><span>Gmail</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="outlook" /><span>Outlook</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/outlook-to-gmail')} aria-label={t.aria2}><ProviderMark provider="outlook" /><span>Outlook</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="gmail" /><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/yahoo-to-gmail')} aria-label={t.aria3}><ProviderMark provider="yahoo" /><span>Yahoo Mail</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="gmail" /><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/icloud-to-gmail')} aria-label={t.aria4}><ProviderMark provider="icloud" /><span>iCloud Mail</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="gmail" /><span>Gmail</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/cpanel-to-microsoft-365')} aria-label={t.aria5}><ProviderMark provider="cpanel" /><span>cPanel</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="microsoft-365" /><span>Microsoft 365</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/yandex-to-microsoft-365')} aria-label={t.aria6}><ProviderMark provider="yandex" /><span>{t.yandex}</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><ProviderMark provider="microsoft-365" /><span>Microsoft 365</span><span className="go">{t.guide}</span></a>
          <a className="rt" href={href(lang, '/migrate/hosting-to-hosting')} aria-label={t.aria7}><span>{t.oldHost}</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><span>{t.newHost}</span><span className="go">{t.guide}</span></a>
          <a className="rt" href="#workspace"><span>{t.any}</span><svg aria-hidden="true" className="a"><use href="#ar" /></svg><span>{t.any}</span><span className="go">{t.manual}</span></a>
        </div>
      </section>
    </>
  );
}
