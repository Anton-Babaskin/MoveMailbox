import { security } from '@/content/sections/security';
import type { Lang } from '@/i18n/config';

export function Security({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = security[lang];
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="band" id="security">
        <div className="shell band-g">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)', color: 'var(--term-hi)' }}>{t.h2a}<span className="ital">{t.h2b}</span></Heading>
            <p className="lede" style={{ marginTop: '18px' }}>{t.lede}</p>
            <a className="go" href="https://github.com/Anton-Babaskin/MoveMailbox/blob/main/SECURITY.md" target="_blank" rel="noreferrer">{t.go}<svg><use href="#ar" /></svg></a>
          </div>

          <div className="board">
            <header>
              <span className="live"><i></i>{t.live}</span>
              <span className="upd">{t.upd}</span>
            </header>
            <ul>
              {t.items.map((item) => (
                <li key={item.tag}>
                  <span className="tag">{item.tag}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                  <i className="dot" aria-hidden="true"></i>
                </li>
              ))}
            </ul>
            <footer>
              <span>{t.footNote}</span>
              <a href="https://github.com/Anton-Babaskin/MoveMailbox" target="_blank" rel="noreferrer">{t.footLink}<svg><use href="#ar" /></svg></a>
            </footer>
          </div>
        </div>
      </section>
    </>
  );
}
