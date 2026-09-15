import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { Errors } from '@/components/sections/errors';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/docs/errors',
  ...pages['/docs/errors'].ru,
});

export default function Page() {
  return (
    <main>
      <PageSchema lang={"ru"} path={"/docs/errors"} kind="collection" />
      <Errors lang={'ru'} pageTitle />
      <FinalCta lang={'ru'} />
    </main>
  );
}
