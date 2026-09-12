'use client';

import { useEffect } from 'react';
import { initProviderGuides } from '@/lib/guides';
import { providerGuides } from '@/content/sections/provider-guides';
import type { Lang } from '@/i18n/config';

export function ProviderGuides({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = providerGuides[lang];
  const Heading = pageTitle ? 'h1' : 'h2';

  useEffect(() => { initProviderGuides(lang); }, [lang]);

  return (
    <>
      <section className="shell" id="guides">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>

        <div className="pv">
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
          <div className="pv-body" id="pvBody"></div>
        </div>
      </section>
    </>
  );
}
