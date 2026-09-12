import { notFound } from 'next/navigation';
import { ImapErrorPage, imapErrorMetadata } from '@/components/imap-error-page';
import { findError, imapErrorSlugs } from '@/data/imap-errors';

export const dynamicParams = false;

export function generateStaticParams() {
  return imapErrorSlugs.map((code) => ({ code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return imapErrorMetadata(code);
}

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!findError(code)) notFound();
  return <ImapErrorPage slug={code} />;
}
