import { FinalCta } from '@/components/sections/final-cta';
import { JsonLd } from '@/components/json-ld';
import { legal, legalUpdatedLabel, type LegalDocId } from '@/content/legal';
import { guideArticlePage } from '@/content/guide-article-page';
import { breadcrumbLd, webPageLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';

/**
 * Адрес поддержки в правовом тексте должен открывать почтовый клиент:
 * человек, который дочитал до раздела о своих правах, не должен копировать
 * адрес руками. Разметка строится разбиением строки, без dangerouslySetInnerHTML.
 */
const MAIL = /([\w.+-]+@[\w-]+\.[\w.-]+[\w])/g;

function withMail(text: string) {
  return text.split(MAIL).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${part}`}>{part}</a>
    ) : (
      part
    ),
  );
}

/**
 * Общая раскладка для /privacy и /terms — одна колонка, узкая мера строки.
 * Текст компонент достаёт сам: страница указывает только язык и документ.
 */
export function LegalDoc({ lang, doc }: { lang: Lang; doc: LegalDocId }) {
  const t = legal[doc][lang];
  /* Разметка живёт здесь, а не на странице: обе правовые страницы берут
     текст отсюда же, и заголовок в schema не разъедется с заголовком на
     экране по построению. */
  const path = href(lang, `/${doc}`);
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: guideArticlePage[lang].home, path: href(lang, '/') },
            { name: t.title, path },
          ]),
          webPageLd({ name: t.title, description: t.meta.description, path, lang }),
        ]}
      />
      <section className="shell legal">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>
            {legalUpdatedLabel[lang](t.updated)}
          </p>
        </div>
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((text) => (
              <p key={text}>{withMail(text)}</p>
            ))}
          </section>
        ))}
      </section>
      <FinalCta lang={lang} />
    </main>
  );
}
