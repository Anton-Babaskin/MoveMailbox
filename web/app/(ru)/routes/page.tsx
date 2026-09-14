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

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/routes',
  ...pages['/routes'].ru,
});

export default function Page() {
  return (
    <main>
      <PageSchema lang={"ru"} path={"/routes"} kind="collection" />
      <HowItWorks lang={'ru'} pageTitle />
      <ProtocolLimits lang={'ru'} />
      <PopularRoutes lang={'ru'} />
      {/* Каталог маршрутов и страницы провайдеров ссылаются друг на друга:
          часть спроса приходит на пару A → B, часть — на один сервис. */}
      <Quickstart lang={'ru'} />
      <RouteIndex lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
