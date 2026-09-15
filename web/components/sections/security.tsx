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
            <a className="go" href="https://github.com/Anton-Babaskin/MoveMailbox/blob/main/SECURITY.md" target="_blank" rel="noreferrer">{t.go}<svg aria-hidden="true"><use href="#ar" /></svg></a>
          </div>

          <div className="board">
            {/* Была панель мониторинга: моноширинные метки TTL, IN-MEMORY,
                NO-STORE, пульсирующие точки состояния и подпись «предварительная
                версия» мелкими прописными. Читалось как серверный дашборд, хотя
                рассказывает эта секция не про аптайм, а про то, что происходит
                с чужим паролем. Осталась суть: значок, заголовок, объяснение.
                Значки заданы здесь, а не в словаре: они одни на три языка. */}
            <header>
              <span className="live">{t.live}</span>
            </header>
            <ul>
              {t.items.map((item, i) => (
                <li key={item.title}>
                  <span className="b-ico" aria-hidden="true">
                    {/* ключ · щит · конверт · сервер — по смыслу пункта:
                        свой ключ на задание, расшифровка в памяти, письма не
                        оседают у нас, всё можно держать на своём железе. */}
                    <svg><use href={`#${['ky', 'sh', 'lp', 'sv'][i] ?? 'sh'}`} /></svg>
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <footer>
              <span>{t.footNote}</span>
              <a href="https://github.com/Anton-Babaskin/MoveMailbox" target="_blank" rel="noreferrer">{t.footLink}<svg aria-hidden="true"><use href="#ar" /></svg></a>
            </footer>
          </div>
        </div>
      </section>
    </>
  );
}
