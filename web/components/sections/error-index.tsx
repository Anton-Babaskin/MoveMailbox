import { imapErrors } from '@/data/imap-errors';

export function ErrorIndex() {
  return (
    <section className="shell" id="all-errors">
      <div className="head-wide">
        <p className="eyebrow">Разбор по ошибкам</p>
        <h2>
          Ответ сервера <span className="ital">и что с ним делать</span>
        </h2>
      </div>
      <div className="error-index">
        {imapErrors.map((e) => (
          <a key={e.slug} href={`/docs/errors/${e.slug}`}>
            <code>{e.code}</code>
            <strong>{e.ru.h1}</strong>
            <span>{e.ru.description}</span>
            <svg>
              <use href="#ar" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
