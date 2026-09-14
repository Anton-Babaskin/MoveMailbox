import type { Metadata } from 'next';
import { PageSchema } from '@/components/page-schema';
import { ProviderGuides } from '@/components/sections/provider-guides';
import { FaqFull } from '@/components/sections/faq-full';
import { GuideList } from '@/components/sections/guide-list';
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
    path: '/guides',
    ...pages['/guides'][l],
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
      <PageSchema lang={l} path="/guides" kind="collection" />
      <ProviderGuides lang={l} pageTitle />
      <GuideList lang={l} />
      <FaqFull lang={l} />
      <FinalCta lang={l} />
    </main>
  );
}
