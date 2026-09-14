import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import { findGuideArticle } from '@/data/guide-articles';
import { breadcrumbLd, buildMetadata, faqLd, techArticleLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';
import { guideArticlePage } from '@/content/guide-article-page';

/**
 * Отдельный гайд в /guides/<слаг>: одна техническая тема, разобранная до конца.
 * От страницы провайдера отличается тем, что здесь нет «стороны» — есть вопрос
 * и ответ на него, поэтому разметка TechArticle, а не HowTo.
 */
export function guideArticleMetadata(lang: Lang, slug: string): Metadata {
  const guide = findGuideArticle(slug);
  if (!guide) return {};
  const copy = guide[lang];
  return buildMetadata({
    language: lang,
    path: `/guides/${slug}`,
    title: copy.title,
    description: copy.description,
    ogType: 'article',
  });
}

export function GuideArticlePage({ lang, slug }: { lang: Lang; slug: string }) {
  const guide = findGuideArticle(slug);
  if (!guide) return null;
  const copy = guide[lang];
  const t = guideArticlePage[lang];
  const path = `/guides/${slug}`;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.home, path: href(lang, '/') },
            { name: t.guides, path: href(lang, '/guides') },
            { name: copy.h1, path: href(lang, path) },
          ]),
          techArticleLd({
            headline: copy.h1,
            description: copy.description,
            path: href(lang, path),
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{copy.h1}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>{copy.intro}</p>
        </div>

        <div className="guide-body">
          {copy.sections.map((section) => (
            <article key={section.h}>
              <h2>{section.h}</h2>
              {section.p.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>
                      <svg aria-hidden="true"><use href="#ck" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <p style={{ marginTop: '28px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta}
            <svg aria-hidden="true"><use href="#ar" /></svg>
          </a>
        </p>
      </section>

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{t.faqEyebrow}</p>
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="faq">
          <div>
            {copy.faq.filter((_, i) => i % 2 === 0).map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}<span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div>
            {copy.faq.filter((_, i) => i % 2 === 1).map(([q, a]) => (
              <details key={q}>
                <summary>{q}<span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}
