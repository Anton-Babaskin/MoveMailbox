import { guideArticles } from '@/data/guide-articles';
import { guideArticlePage } from '@/content/guide-article-page';
import { href, type Lang } from '@/i18n/config';

/** Список отдельных гайдов на /guides: без него страницы остаются сиротами,
 *  на которые ведёт только карта сайта. */
export function GuideList({ lang }: { lang: Lang }) {
  const t = guideArticlePage[lang];
  return (
    <section className="shell">
      <div className="head-wide">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2>{t.listTitle}</h2>
        <p className="lede" style={{ marginTop: '14px' }}>{t.listLede}</p>
      </div>
      <div className="qs-grid">
        {guideArticles.map((guide) => (
          <a className="qs-card" key={guide.slug} href={href(lang, `/guides/${guide.slug}`)}>
            <span className="qs-body">
              <b>{guide[lang].h1}</b>
              <small>{guide[lang].description}</small>
            </span>
            <span className="qs-go">
              {t.cta}
              <svg aria-hidden="true"><use href="#ar" /></svg>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
