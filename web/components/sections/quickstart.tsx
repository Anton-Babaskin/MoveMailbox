import { ProviderMark } from '@/components/provider-mark';
import { quickstart, quickstartMarks, quickstartOrder } from '@/content/sections/quickstart';
import { findProviderHub } from '@/data/provider-hubs';
import { mark as providerMark } from '@/data/provider-marks';
import type { ProviderKey } from '@/data/providers';
import { href, type Lang } from '@/i18n/config';

/**
 * Слаг плитки и ключ провайдера совпадают не везде, а последняя плитка —
 * вообще не сервис, а «любой IMAP-сервер». Для неё остаётся буква из
 * quickstartMarks; остальные берут общий значок, и Gmail на этой странице
 * выглядит так же, как в ленте и в каталоге маршрутов.
 */
const AS_PROVIDER: Record<string, ProviderKey> = {
  gmail: 'gmail',
  'microsoft-365': 'microsoft-365',
  yahoo: 'yahoo',
  exchange: 'exchange',
};

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
    <section className="shell" id="quickstart" data-fx="zoom">
      <div className="head-wide" data-fx-head>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
        <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
      </div>

      <div className="qs-grid" data-fx-items>
        {quickstartOrder.map((slug) => {
          const hub = findProviderHub(slug);
          const key = AS_PROVIDER[slug];
          const mark = key ? providerMark(key) : quickstartMarks[slug];
          if (!hub || !mark) return null;
          return (
            <a
              className="qs-card"
              key={slug}
              href={href(lang, `/migrate/${slug}`)}
              style={{ ['--b1' as string]: mark.b1, ['--b2' as string]: mark.b2 }}
            >
              {key ? (
                <ProviderMark provider={key} size="lg" />
              ) : (
                <span className="pvi lg" aria-hidden="true"><i>{mark.letter}</i></span>
              )}
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
