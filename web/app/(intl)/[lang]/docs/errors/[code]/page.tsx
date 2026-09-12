import { notFound } from 'next/navigation';
import { ImapErrorPage, imapErrorMetadata } from '@/components/imap-error-page';
import { findError, imapErrorSlugs } from '@/data/imap-errors';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) =>
    imapErrorSlugs.map((code) => ({ lang, code })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}) {
  const { lang, code } = await params;
  const l = toLang(lang);
  return imapErrorMetadata(l, code);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}) {
  const { lang, code } = await params;
  const l = toLang(lang);
  if (!findError(code)) notFound();
  return <ImapErrorPage lang={l} slug={code} />;
}
