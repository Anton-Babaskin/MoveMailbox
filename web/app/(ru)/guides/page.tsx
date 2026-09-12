import type { Metadata } from 'next';
import { ProviderGuides } from '@/components/sections/provider-guides';
import { FaqFull } from '@/components/sections/faq-full';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/guides',
  ...pages['/guides'].ru,
});

export default function Page() {
  return (
    <main>
      <ProviderGuides lang={'ru'} pageTitle />
      <FaqFull lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
