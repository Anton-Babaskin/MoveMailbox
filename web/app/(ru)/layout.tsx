import type { Metadata, Viewport } from 'next';
import { SiteShell } from '@/components/site-shell';
import { pages } from '@/content/pages';
import { buildMetadata, SITE, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  ...buildMetadata({ language: 'ru', path: '', ...pages['/'].ru }),
  title: { default: pages['/'].ru.title, template: '%s' },
  applicationName: SITE_NAME,
  icons: { icon: '/brand/favicon.svg', apple: '/brand/favicon-180.png' },
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
