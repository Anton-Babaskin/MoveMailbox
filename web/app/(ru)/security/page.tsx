import type { Metadata } from 'next';
import { Security } from '@/components/sections/security';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/security',
  ...pages['/security'].ru,
});

export default function Page() {
  return (
    <main>
      <Security lang={'ru'} pageTitle />
      <FinalCta lang={'ru'} />
    </main>
  );
}
