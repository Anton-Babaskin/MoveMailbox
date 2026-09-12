'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { langSuggest } from '@/content/lang-suggest';
import { DEFAULT_LANG, LANGS, href, isLang, type Lang } from '@/i18n/config';

const STORE = 'mm.lang';

/** Первый язык из списка предпочтений браузера, для которого есть версия сайта. */
function preferred(): Lang | null {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of list) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return null;
}

function stored(): string | null {
  try {
    return localStorage.getItem(STORE);
  } catch {
    return null;
  }
}

export function remember(lang: Lang) {
  try {
    localStorage.setItem(STORE, lang);
  } catch {
    /* приватный режим — просто не запомним */
  }
}

/**
 * Предложение перейти на язык браузера.
 *
 * Именно предложение, а не перенаправление. Автоматический редирект по языку
 * ломает две вещи сразу: человек теряет адрес, который ему прислали, а краулер
 * получает все языковые версии по одному адресу вопреки hreflang. Поэтому
 * страница остаётся той, что запросили, а выбор предлагается один раз и
 * запоминается — ровно как советует Search Central.
 *
 * На сервере не рендерится ничего: язык браузера там неизвестен, а статический
 * экспорт один на всех.
 */
export function LangSuggest({ lang }: { lang: Lang }) {
  const pathname = usePathname() || '/';
  const [want, setWant] = useState<Lang | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (stored()) return;
    const guess = preferred();
    if (!guess || guess === lang) return;
    /* Показываем не сразу: баннер, выехавший поверх первого экрана в момент
       загрузки, воспринимается как всплывающее окно. */
    const t = setTimeout(() => setWant(guess), 900);
    return () => clearTimeout(t);
  }, [lang]);

  if (!want) return null;

  const t = langSuggest[want];
  /* Путь без языкового префикса — чтобы предложить ту же страницу, а не главную. */
  const clean = LANGS.reduce(
    (p, l) => (l !== DEFAULT_LANG && (p === `/${l}` || p.startsWith(`/${l}/`)) ? p.slice(l.length + 1) || '/' : p),
    pathname,
  );

  function close(choice: Lang) {
    remember(choice);
    setLeaving(true);
    setTimeout(() => setWant(null), 220);
  }

  return (
    <div className={`lang-suggest${leaving ? ' out' : ''}`} role="region" aria-label={t.title} lang={want}>
      <p>{t.title}</p>
      <div className="lang-suggest-acts">
        <a className="btn btn-p btn-s" href={href(want, clean)} onClick={() => remember(want)}>
          {t.action}
        </a>
        <button type="button" className="lang-suggest-no" onClick={() => close(lang)}>
          {t.dismiss}
        </button>
      </div>
      <button
        type="button"
        className="lang-suggest-x"
        aria-label={t.close}
        onClick={() => close(lang)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
