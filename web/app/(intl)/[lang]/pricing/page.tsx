import type { Metadata } from 'next';
import { UseCases } from '@/components/sections/use-cases';
import { Calculator } from '@/components/sections/calculator';
import { Pricing } from '@/components/sections/pricing';
import { Business } from '@/components/sections/business';
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
    path: '/pricing',
    ...pages['/pricing'][l],
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
      <UseCases lang={l} pageTitle />
      <Calculator lang={l} />
      <Pricing lang={l} />
      <Business lang={l} />
      <FinalCta lang={l} />
    </main>
  );
}
