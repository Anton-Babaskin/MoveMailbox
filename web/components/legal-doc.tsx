import { FinalCta } from '@/components/sections/final-cta';

type Section = { h: string; p: string[] };

/** Общая раскладка для /privacy и /terms — одна колонка, узкая мера строки. */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <main>
      <section className="shell legal">
        <div className="head-wide">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede" style={{ marginTop: '16px' }}>
            Редакция от {updated}.
          </p>
        </div>
        {sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
      </section>
      <FinalCta />
    </main>
  );
}
