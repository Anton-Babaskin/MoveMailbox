import { ProviderGuidesInit } from '@/components/section-init';
import { ProviderMark } from '@/components/provider-mark';
import { mark } from '@/data/provider-marks';
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
            <button role="tab" aria-selected="true" data-pv="gmail" style={{ '--b1': mark('gmail').b1, '--b2': mark('gmail').b2 } as React.CSSProperties}>
              <ProviderMark provider="gmail" /><span className="txt"><b>{t.tabs.gmail.name}</b><small>imap.gmail.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="m365" style={{ '--b1': mark('microsoft-365').b1, '--b2': mark('microsoft-365').b2 } as React.CSSProperties}>
              <ProviderMark provider="microsoft-365" /><span className="txt"><b>{t.tabs.m365.name}</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="outlook" style={{ '--b1': mark('outlook').b1, '--b2': mark('outlook').b2 } as React.CSSProperties}>
              <ProviderMark provider="outlook" /><span className="txt"><b>{t.tabs.outlook.name}</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="yandex" style={{ '--b1': mark('yandex').b1, '--b2': mark('yandex').b2 } as React.CSSProperties}>
              <ProviderMark provider="yandex" /><span className="txt"><b>{t.tabs.yandex.name}</b><small>imap.yandex.ru</small></span></button>
            <button role="tab" aria-selected="false" data-pv="icloud" style={{ '--b1': mark('icloud').b1, '--b2': mark('icloud').b2 } as React.CSSProperties}>
              <ProviderMark provider="icloud" /><span className="txt"><b>{t.tabs.icloud.name}</b><small>imap.mail.me.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="zoho" style={{ '--b1': mark('zoho').b1, '--b2': mark('zoho').b2 } as React.CSSProperties}>
              <ProviderMark provider="zoho" /><span className="txt"><b>{t.tabs.zoho.name}</b><small>imap.zoho.eu</small></span></button>
            <button role="tab" aria-selected="false" data-pv="cpanel" style={{ '--b1': mark('cpanel').b1, '--b2': mark('cpanel').b2 } as React.CSSProperties}>
              <ProviderMark provider="cpanel" /><span className="txt"><b>{t.tabs.cpanel.name}</b><small>mail.domain.tld</small></span></button>
          </div>
          {/* Первая вкладка отрисована на сервере.
              Раньше панель приходила пустой и заполнялась скриптом после
              гидратации — страница прыгала на 0.22 CLS при пороге 0.1.
              Остальные вкладки по-прежнему рисует lib/guides.ts по клику. */}
          <div className="pv-body" id="pvBody">
            <div className="pv-panel">
              <div className="pv-head">
                <ProviderMark provider="gmail" size="lg" />
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
