import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ProtocolLimits } from '@/components/sections/protocol-limits';
import { PopularRoutes } from '@/components/sections/popular-routes';
import { Quickstart } from '@/components/sections/quickstart';
import { RouteIndex } from '@/components/sections/route-index';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';
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
  return buildMetadata({
    language: l,
    path: '/routes',
    ...pages['/routes'][l],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const l = toLang(lang);
  return (
    <main>
      <PageSchema lang={l} path="/routes" kind="collection" />
      <HowItWorks lang={l} pageTitle />
      <ProtocolLimits lang={l} />
      <PopularRoutes lang={l} />
      {/* Каталог маршрутов и страницы провайдеров ссылаются друг на друга:
          часть спроса приходит на пару A → B, часть — на один сервис. */}
      <Quickstart lang={l} />
      <RouteIndex lang={l} />
      <FinalCta lang={l} />
    </main>
  );
}
