'use client';

import { useEffect } from 'react';
import { initProviderGuides } from '@/lib/guides';

export function ProviderGuides({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  useEffect(() => { initProviderGuides(); }, []);

  return (
    <>
      <section className="shell" id="guides">
        <div className="head-wide">
          <p className="eyebrow">Справочник провайдеров</p>
          <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)" }}>Настройки провайдеров <span className="ital">и подводные камни.</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>Хост, порт, где взять пароль приложения и что провайдер делает не так, как вы ожидаете. Собрано то, из-за чего перенос ломается на первой минуте.</p>
        </div>

        <div className="pv">
          <div className="pv-nav" role="tablist" aria-label="Провайдеры">
            <button role="tab" aria-selected="true" data-pv="gmail" style={{ '--b1': '#F2685A', '--b2': '#C42D20' } as React.CSSProperties}>
              <span className="pvi"><i>G</i></span><span className="txt"><b>Gmail</b><small>imap.gmail.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="m365" style={{ '--b1': '#5A8DE8', '--b2': '#1B4699' } as React.CSSProperties}>
              <span className="pvi"><i>M</i></span><span className="txt"><b>Microsoft 365</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="outlook" style={{ '--b1': '#45BCF2', '--b2': '#0E74BE' } as React.CSSProperties}>
              <span className="pvi"><i>O</i></span><span className="txt"><b>Outlook.com</b><small>outlook.office365.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="yandex" style={{ '--b1': '#FF6055', '--b2': '#B81208' } as React.CSSProperties}>
              <span className="pvi"><i>Я</i></span><span className="txt"><b>Яндекс.Почта</b><small>imap.yandex.ru</small></span></button>
            <button role="tab" aria-selected="false" data-pv="icloud" style={{ '--b1': '#94DBF8', '--b2': '#3390D4' } as React.CSSProperties}>
              <span className="pvi"><i>i</i></span><span className="txt"><b>iCloud Mail</b><small>imap.mail.me.com</small></span></button>
            <button role="tab" aria-selected="false" data-pv="zoho" style={{ '--b1': '#4FC684', '--b2': '#147C4E' } as React.CSSProperties}>
              <span className="pvi"><i>Z</i></span><span className="txt"><b>Zoho Mail</b><small>imap.zoho.eu</small></span></button>
            <button role="tab" aria-selected="false" data-pv="cpanel" style={{ '--b1': '#FF9B4D', '--b2': '#C4530D' } as React.CSSProperties}>
              <span className="pvi"><i>cP</i></span><span className="txt"><b>cPanel / Dovecot</b><small>mail.domain.tld</small></span></button>
          </div>
          <div className="pv-body" id="pvBody"></div>
        </div>
      </section>
    </>
  );
}
