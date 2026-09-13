import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import { NotFoundPage } from '@/components/not-found-page';
import { DEFAULT_LANG } from '@/i18n/config';
import { SITE, SITE_NAME } from '@/lib/seo';

/**
 * Единственная страница вне языковых деревьев: экспорт кладёт её в 404.html,
 * и её отдают и GitHub Pages, и Go-хендлер на любой ненайденный адрес.
 * Корневого layout у проекта нет — оба лежат в группах (ru) и (intl), —
 * поэтому каркас со <html> подключается здесь напрямую.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: '404 — страница не найдена — MoveMailbox',
  description:
    'Такой страницы на MoveMailbox нет: адрес набран с опечаткой или страница переехала.',
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
  // Страница отдаётся с кодом 404, но метка лишней не будет: она же
  // защищает от мягкой 404, если хендлер когда-нибудь ответит 200.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SiteShell lang={DEFAULT_LANG} notFound>
      <NotFoundPage />
    </SiteShell>
  );
}
