import type { Metadata } from 'next';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ProtocolLimits } from '@/components/sections/protocol-limits';
import { PopularRoutes } from '@/components/sections/popular-routes';
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
      <HowItWorks lang={'ru'} pageTitle />
      <ProtocolLimits lang={'ru'} />
      <PopularRoutes lang={'ru'} />
      <RouteIndex lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
