import { Manrope, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import { IconSprite } from '@/components/icon-sprite';
import { PageEffects } from '@/components/page-effects';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { HTML_LANG, type Lang } from '@/i18n/config';
import '@/app/globals.css';

/**
 * Шрифты самохостятся: next/font скачивает их на этапе сборки и кладёт
 * рядом с ассетами. Это требование CSP на бекенде — style-src 'self'
 * и font-src 'self' не пропустят внешний CDN.
 */
const sans = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-serif',
  display: 'swap',
});

/**
 * Общий каркас страницы. Вызывается из двух корневых layout — русского
 * и языкового: атрибут lang у <html> должен быть настоящим, а не
 * выставляться скриптом, иначе краулер видит на всех страницах русский.
 */
export function SiteShell({
  lang,
  children,
  notFound = false,
}: {
  lang: Lang;
  children: React.ReactNode;
  /** Прокидывается в шапку: см. SiteHeader. */
  notFound?: boolean;
}) {
  return (
    <html lang={HTML_LANG[lang]} suppressHydrationWarning>
      <head>
        <script src="/theme.js" />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
        <IconSprite />
        <div className="aura" aria-hidden="true" />
        <PageEffects />
        <SiteHeader lang={lang} notFound={notFound} />
        {children}
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
