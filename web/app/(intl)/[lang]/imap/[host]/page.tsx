import { notFound } from 'next/navigation';
import { ImapHostPage, imapHostMetadata } from '@/components/imap-host-page';
import { imapHostSlugs, isImapHostSlug } from '@/data/imap-hosts';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) => imapHostSlugs.map((host) => ({ lang, host })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; host: string }>;
}) {
  const { lang, host } = await params;
  return imapHostMetadata(toLang(lang), host);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; host: string }>;
}) {
  const { lang, host } = await params;
  if (!isImapHostSlug(host)) notFound();
  return <ImapHostPage lang={toLang(lang)} slug={host} />;
}
