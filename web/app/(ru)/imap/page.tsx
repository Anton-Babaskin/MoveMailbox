import type { Metadata } from 'next';
import { ImapIndexPage } from '@/components/imap-host-page';
import { PageSchema } from '@/components/page-schema';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/imap',
  ...pages['/imap'].ru,
});

export default function Page() {
  return (
    <>
      <PageSchema lang="ru" path="/imap" kind="collection" />
      <ImapIndexPage lang="ru" />
    </>
  );
}
