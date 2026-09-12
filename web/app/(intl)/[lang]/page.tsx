import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { Workspace } from '@/components/sections/workspace';
import { TrustRow } from '@/components/sections/trust-row';
import { Security } from '@/components/sections/security';
import { Brief } from '@/components/sections/brief';
import { Modes } from '@/components/sections/modes';
import { FaqShort } from '@/components/sections/faq-short';
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
    path: '',
    ...pages['/'][l],
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
      <Hero lang={l} />
      <Workspace lang={l} />
      <TrustRow lang={l} />
      <Security lang={l} />
      <Brief lang={l} />
      <Modes lang={l} />
      <FaqShort lang={l} />
      <FinalCta lang={l} />
    </main>
  );
}
