import { notFound } from 'next/navigation';
import { ImapHostPage, imapHostMetadata } from '@/components/imap-host-page';
import { imapHostSlugs, isImapHostSlug } from '@/data/imap-hosts';

export const dynamicParams = false;

export function generateStaticParams() {
  return imapHostSlugs.map((host) => ({ host }));
}

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  return imapHostMetadata('ru', host);
}

export default async function Page({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  if (!isImapHostSlug(host)) notFound();
  return <ImapHostPage lang="ru" slug={host} />;
}
