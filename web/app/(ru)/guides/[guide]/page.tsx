import { notFound } from 'next/navigation';
import {
  GuideArticlePage,
  guideArticleMetadata,
} from '@/components/guide-article-page';
import { guideArticleSlugs, isGuideArticleSlug } from '@/data/guide-articles';

export const dynamicParams = false;

export function generateStaticParams() {
  return guideArticleSlugs.map((guide) => ({ guide }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guide: string }>;
}) {
  const { guide } = await params;
  return guideArticleMetadata('ru', guide);
}

export default async function Page({
  params,
}: {
  params: Promise<{ guide: string }>;
}) {
  const { guide } = await params;
  if (!isGuideArticleSlug(guide)) notFound();
  return <GuideArticlePage lang="ru" slug={guide} />;
}
