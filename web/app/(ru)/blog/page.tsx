import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { Blog } from '@/components/sections/blog';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/blog',
  ...pages['/blog'].ru,
});

export default function Page() {
  return (
    <main>
      <PageSchema lang={"ru"} path={"/blog"} kind="collection" />
      <Blog lang={'ru'} pageTitle />
      <FinalCta lang={'ru'} />
    </main>
  );
}
