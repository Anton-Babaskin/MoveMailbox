import { modes } from '@/content/sections/modes';
import type { Lang } from '@/i18n/config';

export function Modes({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = modes[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell" id="modes">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="grid3">
          <article className="card lead">
            <div className="ctop"><span className="ico"><svg><use href="#cl" /></svg></span><span className="tagr hot">{t.cloud.tag}</span></div>
            <h3 className="big">{t.cloud.h3}</h3>
            <p className="t">{t.cloud.t}</p>
            <ul className="ticks">
              {t.cloud.ticks.map((tick) => (
                <li key={tick}><svg><use href="#ck" /></svg>{tick}</li>
              ))}
            </ul>
            <a className="go" href="#workspace">{t.cloud.go}<svg><use href="#ar" /></svg></a>
          </article>
          <article className="card">
            <div className="ctop"><span className="ico"><svg><use href="#lp" /></svg></span><span className="tagr">Windows · Linux · macOS</span></div>
            <h3 className="big">{t.desktop.h3}</h3>
            <p className="t">{t.desktop.t}</p>
            <ul className="ticks">
              {t.desktop.ticks.map((tick) => (
                <li key={tick}><svg><use href="#ck" /></svg>{tick}</li>
              ))}
            </ul>
            <div className="os-row">
              <a className="os" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg><use href="#win" /></svg>Windows<small>{t.desktop.win}</small></a>
              <a className="os" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg><use href="#lnx" /></svg>Linux<small>{t.desktop.lnx}</small></a>
              <span className="os soon"><svg><use href="#mac" /></svg>macOS<small>{t.desktop.mac}</small></span>
            </div>
          </article>
          <article className="card">
            <div className="ctop"><span className="ico"><svg><use href="#dkr" /></svg></span><span className="tagr">Self-hosted</span></div>
            <h3 className="big">{t.selfHosted.h3}</h3>
            <p className="t">{t.selfHosted.t1}<code>docker compose up</code>{t.selfHosted.t2}</p>
            <ul className="ticks">
              {t.selfHosted.ticks.map((tick) => (
                <li key={tick}><svg><use href="#ck" /></svg>{tick}</li>
              ))}
            </ul>
            <a className="go" href="https://github.com/Anton-Babaskin/MoveMailbox" target="_blank" rel="noreferrer">{t.selfHosted.go}<svg><use href="#ar" /></svg></a>
          </article>
        </div>
      </section>
    </>
  );
}
