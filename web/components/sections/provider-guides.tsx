import { ProviderGuidesInit } from '@/components/section-init';
import { providerGuides } from '@/content/sections/provider-guides';
import { guidesRuntime } from '@/content/sections/guides-runtime';
import type { Lang } from '@/i18n/config';

export function ProviderGuides({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = providerGuides[lang];
  const rt = guidesRuntime[lang];
  /* Вкладка по умолчанию — та же, что открывает скрипт. */
  const first = rt.pv.gmail;
  const Heading = pageTitle ? 'h1' : 'h2';

  return (
    <>
      <ProviderGuidesInit lang={lang} strings={guidesRuntime[lang]} />
      <section className="shell" id="guides">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>

        <div className="pv">
          {/* Уровень заголовка считается от уровня секции: на странице гайдов
              она открывается h1, и панель провайдера с h3 давала пропуск. */}
          {pageTitle && <h2 className="h-struct">{t.navLabel}</h2>}
          <div className="pv-nav" role="tablist" aria-label={t.navLabel}>
            <button role="tab" aria-selected="true" data-pv="gmail" style={{ '--b1': '#F2685A', '--b2': '#C42D20' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.gmail.letter}</i></span><span className="txt"><b>{t.tabs.gmail.name}</b><small>imap.gmail.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="m365" style={{ '--b1': '#5A8DE8', '--b2': '#1B4699' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.m365.letter}</i></span><span className="txt"><b>{t.tabs.m365.name}</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="outlook" style={{ '--b1': '#45BCF2', '--b2': '#0E74BE' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.outlook.letter}</i></span><span className="txt"><b>{t.tabs.outlook.name}</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="yandex" style={{ '--b1': '#FF6055', '--b2': '#B81208' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.yandex.letter}</i></span><span className="txt"><b>{t.tabs.yandex.name}</b><small>imap.yandex.ru</small></span></button>
            <button role="tab" aria-selected="false" data-pv="icloud" style={{ '--b1': '#94DBF8', '--b2': '#3390D4' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.icloud.letter}</i></span><span className="txt"><b>{t.tabs.icloud.name}</b><small>imap.mail.me.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="zoho" style={{ '--b1': '#4FC684', '--b2': '#147C4E' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.zoho.letter}</i></span><span className="txt"><b>{t.tabs.zoho.name}</b><small>imap.zoho.eu</small></span></button>
            <button role="tab" aria-selected="false" data-pv="cpanel" style={{ '--b1': '#FF9B4D', '--b2': '#C4530D' } as React.CSSProperties}>
              <span className="pvi"><i>{t.tabs.cpanel.letter}</i></span><span className="txt"><b>{t.tabs.cpanel.name}</b><small>mail.domain.tld</small></span></button>
          </div>
          {/* Первая вкладка отрисована на сервере.
              Раньше панель приходила пустой и заполнялась скриптом после
              гидратации — страница прыгала на 0.22 CLS при пороге 0.1.
              Остальные вкладки по-прежнему рисует lib/guides.ts по клику. */}
          <div className="pv-body" id="pvBody">
            <div className="pv-panel">
              <div className="pv-head">
                <span className="pvi lg" style={{ '--b1': '#F2685A', '--b2': '#C42D20' } as React.CSSProperties}>
                  <i>{t.tabs.gmail.letter}</i>
                </span>
                <h3>{first.n}</h3>
                <span className="hosttag">{first.conn[0][1]} : {first.conn[1][1].split(' ')[0]}</span>
              </div>
              <p className="intro">{first.intro}</p>
              <div className="conn">
                {first.conn.map(([label, value]) => (
                  <div key={label}><small>{label}</small><strong>{value}</strong></div>
                ))}
              </div>
              <div className="pv-cols">
                <div>
                  <h4>{rt.stepsTitle}</h4>
                  <ol className="olist">
                    {first.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
                <div>
                  <h4>{rt.warnsTitle}</h4>
                  <ul className="warns">
                    {first.warns.map(([text]) => (
                      <li key={text}><svg aria-hidden="true"><use href="#al" /></svg><span>{text}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="cmd">
                <small>{rt.cmdCaption}</small>
                <pre>{first.cmd}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
