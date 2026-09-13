import { notFound } from 'next/navigation';
import {
  GuideArticlePage,
  guideArticleMetadata,
} from '@/components/guide-article-page';
import { guideArticleSlugs, isGuideArticleSlug } from '@/data/guide-articles';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) =>
    guideArticleSlugs.map((guide) => ({ lang, guide })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; guide: string }>;
}) {
  const { lang, guide } = await params;
  return guideArticleMetadata(toLang(lang), guide);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; guide: string }>;
}) {
  const { lang, guide } = await params;
  if (!isGuideArticleSlug(guide)) notFound();
  return <GuideArticlePage lang={toLang(lang)} slug={guide} />;
}
