import { FinalCta } from '@/components/sections/final-cta';
import { legal, legalUpdatedLabel, type LegalDocId } from '@/content/legal';
import type { Lang } from '@/i18n/config';

/**
 * Общая раскладка для /privacy и /terms — одна колонка, узкая мера строки.
 * Текст компонент достаёт сам: страница указывает только язык и документ.
 */
export function LegalDoc({ lang, doc }: { lang: Lang; doc: LegalDocId }) {
  const t = legal[doc][lang];
  return (
    <main>
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
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
      </section>
      <FinalCta lang={lang} />
    </main>
  );
}
