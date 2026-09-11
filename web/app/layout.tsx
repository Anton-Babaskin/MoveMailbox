import type { Metadata, Viewport } from 'next';
import { Manrope, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import { IconSprite } from '@/components/icon-sprite';
import { PageEffects } from '@/components/page-effects';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SITE, SITE_NAME } from '@/lib/seo';
import './globals.css';

/**
 * Шрифты самохостятся: next/font скачивает их на этапе сборки и кладёт
 * рядом с ассетами. Это требование CSP на бекенде — style-src 'self'
 * и font-src 'self' не пропустят Google Fonts.
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


export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'MoveMailbox — перенос почты между IMAP-серверами',
    template: '%s',
  },
  description:
    'Перенос почты между IMAP-серверами: письма, папки и вложения. Онлайн до 5 ГБ бесплатно или локальный клиент без облачного лимита.',
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/brand/favicon.svg',
    apple: '/brand/favicon-180.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    siteName: SITE_NAME,
    title: 'MoveMailbox — перенос почты между IMAP-серверами',
    description:
      'Письма, папки и вложения. Онлайн без регистрации или на вашем компьютере.',
    images: [{ url: '/og.png', width: 1735, height: 909, alt: SITE_NAME }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#07121B' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script src="/theme.js" />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
        <IconSprite />
        <div className="aura" aria-hidden="true" />
        <PageEffects />
        <SiteHeader />
        <aside className="shell keep" role="note" style={{ padding: '14px 20px' }}>
          Предварительная версия MoveMailbox. Онлайн-перенос и платные услуги ещё
          не открыты; сейчас доступны документация и локальный клиент.
        </aside>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
