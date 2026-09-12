import type { Metadata } from 'next';
import { Blog } from '@/components/sections/blog';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
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
    path: '/blog',
    ...pages['/blog'][l],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const l = toLang(lang);
  return (
    <main>
      <Blog lang={l} pageTitle />
      <FinalCta lang={l} />
    </main>
  );
}
