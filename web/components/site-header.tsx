'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteHeader } from '@/content/site-header';
import {
  DEFAULT_LANG,
  LANGS,
  PREFIXED_LANGS,
  href,
  type Lang,
} from '@/i18n/config';

/** Разделы сайта. Один источник для десктопного и мобильного меню. */
const NAV = [
  { path: '/', key: 'home' },
  { path: '/routes', key: 'routes' },
  { path: '/guides', key: 'guides' },
  { path: '/pricing', key: 'pricing' },
  { path: '/blog', key: 'blog' },
  { path: '/download', key: 'download' },
] as const;

/** Подпись языка в переключателе. */
const LANG_LABEL: Record<Lang, string> = { ru: 'RU', en: 'EN', uk: 'UK' };

/**
 * Разбирает путь на язык и «чистый» путь без префикса локали:
 * '/en/migrate/gmail-to-outlook' → { lang: 'en', path: '/migrate/gmail-to-outlook' }.
 */
function splitLocale(pathname: string): { lang: Lang; path: string } {
  for (const l of PREFIXED_LANGS) {
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return { lang: l, path: pathname.slice(l.length + 1) || '/' };
    }
  }
  return { lang: DEFAULT_LANG, path: pathname };
}

export function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname() || '/';
  const [stuck, setStuck] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const t = siteHeader[lang];

  /** Текущий язык берём из пути: он не расходится с тем, что видит пользователь. */
  const here = splitLocale(pathname);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const stored = root.dataset.theme;
    setDark(
      stored === 'dark' ||
        (!stored && matchMedia('(prefers-color-scheme: dark)').matches),
    );
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  function toggleTheme() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('mm.theme', next);
    } catch {
      /* приватный режим — тема просто не запомнится */
    }
    setDark(!dark);
  }

  const isActive = (path: string) =>
    path === '/' ? here.path === '/' : here.path.startsWith(path);

  return (
    <header className={`top${stuck ? ' stuck' : ''}`} id="top">
      <div className="shell tbar">
        <Link className="logo" href={href(lang, '/')}>
          <span className="mark">
            <svg>
              <use href="#ml" />
            </svg>
          </span>
          <span className="wordmark">
            <b>Move</b>Mailbox
          </span>
        </Link>

        <nav className="main">
          {NAV.map((item) => (
            <Link
              key={item.path}
              href={href(lang, item.path)}
              className={isActive(item.path) ? 'now' : undefined}
            >
              {t[item.key]}
            </Link>
          ))}
        </nav>

        <div className="tend">
          <div className="seg" role="group" aria-label={t.langGroup}>
            {LANGS.map((l) => (
              <Link
                key={l}
                href={href(l, here.path)}
                aria-current={l === here.lang ? 'page' : undefined}
              >
                {LANG_LABEL[l]}
              </Link>
            ))}
          </div>

          <button
            className="tgl"
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? t.themeLight : t.themeDark}
          >
            <svg>
              <use href={dark ? '#sn' : '#mn'} />
            </svg>
          </button>

          <Link className="btn btn-p btn-s hdr-cta" href={href(lang, '/download')}>
            {t.cta}
            <svg style={{ width: 15, height: 15 }}>
              <use href="#dl" />
            </svg>
          </Link>

          <button
            className="tgl burger"
            type="button"
            aria-label={t.menu}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <nav className="mob-nav" aria-label={t.mobNav}>
          {NAV.map((item) => (
            <Link
              key={item.path}
              href={href(lang, item.path)}
              className={isActive(item.path) ? 'now' : undefined}
            >
              {t[item.key]}
            </Link>
          ))}
          <Link href={href(lang, '/security')}>{t.security}</Link>
          <Link href={href(lang, '/docs/errors')}>{t.errors}</Link>
          <div className="mob-lang">
            {LANGS.map((l) => (
              <Link key={l} href={href(l, here.path)}>
                {LANG_LABEL[l]}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
