import type { Metadata } from 'next';
import { Errors } from '@/components/sections/errors';
import { ErrorIndex } from '@/components/sections/error-index';
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
      <Errors lang={'ru'} pageTitle />
      <ErrorIndex lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
