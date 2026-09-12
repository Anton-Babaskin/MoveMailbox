import type { Metadata } from 'next';
import { LegalDoc } from '@/components/legal-doc';
import { legal } from '@/content/legal';
import { buildMetadata } from '@/lib/seo';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const l = toLang(lang);
  return buildMetadata({
    language: l,
    path: '/terms',
    ...legal.terms[l].meta,
    // Заполните {{...}} и поменяйте на index:true — до этого страница в индекс
    // не идёт: robots остаётся { index: false, follow: true }.
    index: false,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const l = toLang(lang);
  return <LegalDoc lang={l} doc="terms" />;
}
