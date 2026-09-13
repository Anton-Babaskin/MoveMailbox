import type { Metadata, Viewport } from 'next';
import { SiteShell } from '@/components/site-shell';
import { pages } from '@/content/pages';
import { buildMetadata, SITE, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  ...buildMetadata({ language: 'ru', path: '', ...pages['/'].ru }),
  title: { default: pages['/'].ru.title, template: '%s' },
  applicationName: SITE_NAME,
  icons: {
    /* Порядок важен: SVG первым для браузеров, следом растровые.
       /favicon.ico обязателен отдельно — робот Яндекса ищет его по корню и
       без него пишет «Файл фавиконки не найден», даже когда SVG отдаётся. */
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    ],
    shortcut: '/favicon.ico',
    apple: '/brand/favicon-180.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#07121B' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default function RuLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SiteShell lang="ru">{children}</SiteShell>;
}
