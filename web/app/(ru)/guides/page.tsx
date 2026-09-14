import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { ProviderGuides } from '@/components/sections/provider-guides';
import { FaqFull } from '@/components/sections/faq-full';
import { GuideList } from '@/components/sections/guide-list';
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
      <PageSchema lang={"ru"} path={"/guides"} kind="collection" />
      <ProviderGuides lang={'ru'} pageTitle />
      <GuideList lang={'ru'} />
      <FaqFull lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
