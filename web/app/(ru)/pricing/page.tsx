import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { UseCases } from '@/components/sections/use-cases';
import { Calculator } from '@/components/sections/calculator';
import { Pricing } from '@/components/sections/pricing';
import { Business } from '@/components/sections/business';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/pricing',
  ...pages['/pricing'].ru,
});

export default function Page() {
  return (
    <main>
      <PageSchema lang={"ru"} path={"/pricing"} kind="app" />
      <UseCases lang={'ru'} pageTitle />
      <Calculator lang={'ru'} />
      <Pricing lang={'ru'} />
      <Business lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
