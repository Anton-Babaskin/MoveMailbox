'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Разделы сайта. Один источник для десктопного и мобильного меню. */
const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/routes/', label: 'Маршруты' },
  { href: '/guides/', label: 'Провайдеры' },
  { href: '/pricing/', label: 'Тарифы' },
  { href: '/blog/', label: 'Блог' },
  { href: '/download/', label: 'Скачать' },
] as const;

/**
 * Языки. EN и UK включаются вместе с появлением /en и /uk —
 * переключатель, ведущий на 404, хуже отсутствующего переключателя.
 */
const LANGS = [{ code: 'RU', href: '/' }] as const;

export function SiteHeader() {
  const pathname = usePathname() || '/';
  const [stuck, setStuck] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);

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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className={`top${stuck ? ' stuck' : ''}`} id="top">
      <div className="shell tbar">
        <Link className="logo" href="/">
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
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'now' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="tend">
          <div className="seg" role="group" aria-label="Язык">
            {LANGS.map((l) => (
              <Link
                key={l.code}
                href={l.href}
                aria-current={l.href === '/' ? 'page' : undefined}
              >
                {l.code}
              </Link>
            ))}
          </div>

          <button
            className="tgl"
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
          >
            <svg>
              <use href={dark ? '#sn' : '#mn'} />
            </svg>
          </button>

          <Link className="btn btn-p btn-s hdr-cta" href="/download/">
            Скачать клиент
            <svg style={{ width: 15, height: 15 }}>
              <use href="#dl" />
            </svg>
          </Link>

          <button
            className="tgl burger"
            type="button"
            aria-label="Меню"
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
        <nav className="mob-nav" aria-label="Мобильная навигация">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'now' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/security/">Безопасность</Link>
          <Link href="/docs/errors/">Ошибки IMAP</Link>
          <div className="mob-lang">
            {LANGS.map((l) => (
              <Link key={l.code} href={l.href}>
                {l.code}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
