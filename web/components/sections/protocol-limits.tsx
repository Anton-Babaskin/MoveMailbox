import { protocolLimits } from '@/content/sections/protocol-limits';
import type { Lang } from '@/i18n/config';

export function ProtocolLimits({ lang }: { lang: Lang }) {
  const t = protocolLimits[lang];
  return (
    <>
      <section className="shell alt">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="tx-cols">
          <div className="tx-col tx-yes">
            <h3><span className="badge-sm">{t.yesBadge}</span></h3>
            <p>{t.yesNote}</p>
            <ul className="tx-list">
              {t.yes.map((it) => (
                <li key={it.b}><span className="m"><svg><use href="#ck" /></svg></span><div><b>{it.b}</b><span>{it.s}</span></div></li>
              ))}
            </ul>
          </div>
          <div className="tx-col tx-no">
            <h3><span className="badge-sm">{t.noBadge}</span></h3>
            <p>{t.noNote}</p>
            <ul className="tx-list">
              {t.no.map((it) => (
                <li key={it.b}><span className="m"><svg><use href="#ar" /></svg></span><div><b>{it.b}</b><span>{it.s}</span></div></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="tx-foot"><b>{t.footLabel}</b> {t.footText}</p>
      </section>
    </>
  );
}
