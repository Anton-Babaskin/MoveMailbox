'use client';

import { useEffect, useState } from 'react';
import { notFound } from '@/content/not-found';
import { DEFAULT_LANG, href, isLang, type Lang } from '@/i18n/config';

/**
 * Содержимое страницы 404.
 *
 * На сервере рендерится язык по умолчанию: 404.html один на весь сайт,
 * и другого варианта у статического экспорта нет. После монтирования язык
 * уточняется по префиксу адреса — /en/… и /uk/… получают свой текст и
 * ссылки в своё дерево, а не в русское.
 */
export function NotFoundPage() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const prefix = window.location.pathname.split('/')[1];
    if (isLang(prefix)) setLang(prefix);
  }, []);

  const t = notFound[lang];

  return (
    <main>
      <section className="shell" style={{ paddingBlock: '90px 40px' }}>
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.h1}</h1>
          <p className="lede" style={{ marginTop: '18px' }}>
            {t.lede}
          </p>
        </div>
        <div className="route-links">
          {t.links.map((link) => (
            <a key={link.path} className="brief-link" href={href(lang, link.path)}>
              {link.label}
              <svg aria-hidden="true">
                <use href="#ar" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
