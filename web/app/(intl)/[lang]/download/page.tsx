import type { Metadata } from 'next';
import { Modes } from '@/components/sections/modes';
import { DesktopApp } from '@/components/sections/desktop-app';
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
    path: '/download',
    ...pages['/download'][l],
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
      <Modes lang={l} pageTitle />
      <DesktopApp lang={l} />
      <FinalCta lang={l} />
    </main>
  );
}
