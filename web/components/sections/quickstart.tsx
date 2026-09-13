import { quickstart, quickstartMarks, quickstartOrder } from '@/content/sections/quickstart';
import { findProviderHub } from '@/data/provider-hubs';
import { href, type Lang } from '@/i18n/config';

/**
 * Плитки «откуда переносим» на главной.
 *
 * Каждая ведёт на страницу провайдера — это вход по запросу про один сервис,
 * когда вторая сторона ещё не выбрана. Заголовок плитки берётся из самой
 * страницы, чтобы подпись и адрес не разъехались.
 */
export function Quickstart({ lang }: { lang: Lang }) {
  const t = quickstart[lang];

  return (
    <section className="shell" id="quickstart">
      <div className="head-wide">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
        <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
      </div>

      <div className="qs-grid">
        {quickstartOrder.map((slug) => {
          const hub = findProviderHub(slug);
          const mark = quickstartMarks[slug];
          if (!hub || !mark) return null;
          return (
            <a
              className="qs-card"
              key={slug}
              href={href(lang, `/migrate/${slug}`)}
              style={{ ['--b1' as string]: mark.b1, ['--b2' as string]: mark.b2 }}
            >
              <span className="pvi lg" aria-hidden="true"><i>{mark.letter}</i></span>
              <span className="qs-body">
                <b>{hub[lang].h1}</b>
                <small>{t.cards[slug]}</small>
              </span>
              <span className="qs-go">
                {t.go}
                <svg aria-hidden="true"><use href="#ar" /></svg>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
