import type { Metadata, Viewport } from 'next';
import { SiteShell } from '@/components/site-shell';
import { pages } from '@/content/pages';
import { buildMetadata, SITE, SITE_NAME } from '@/lib/seo';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const l = toLang(lang);
  return {
    metadataBase: new URL(SITE),
    ...buildMetadata({ language: l, path: '', ...pages['/'][l] }),
    title: { default: pages['/'][l].title, template: '%s' },
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
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#07121B' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

export default async function IntlLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  const l = toLang(lang);
  return <SiteShell lang={l}>{children}</SiteShell>;
}
