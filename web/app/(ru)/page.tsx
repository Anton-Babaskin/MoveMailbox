import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Workspace } from '@/components/sections/workspace';
import { TrustRow } from '@/components/sections/trust-row';
import { Security } from '@/components/sections/security';
import { Brief } from '@/components/sections/brief';
import { Modes } from '@/components/sections/modes';
import { FaqShort } from '@/components/sections/faq-short';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '',
  ...pages['/'].ru,
});

export default function Page() {
  return (
    <main>
      <Hero lang={'ru'} />
      <Workspace lang={'ru'} />
      <TrustRow lang={'ru'} />
      <Security lang={'ru'} />
      <Brief lang={'ru'} />
      <Modes lang={'ru'} />
      <FaqShort lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
