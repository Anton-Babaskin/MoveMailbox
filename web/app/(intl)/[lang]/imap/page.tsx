import { ImapIndexPage } from '@/components/imap-host-page';
import { PageSchema } from '@/components/page-schema';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = toLang((await params).lang);
  return buildMetadata({ language: l, path: '/imap', ...pages['/imap'][l] });
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = toLang((await params).lang);
  return (
    <>
      <PageSchema lang={l} path="/imap" kind="collection" />
      <ImapIndexPage lang={l} />
    </>
  );
}
