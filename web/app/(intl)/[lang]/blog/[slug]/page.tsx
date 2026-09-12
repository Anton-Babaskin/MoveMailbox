import { notFound } from 'next/navigation';
import { BlogPostPage, blogPostMetadata } from '@/components/blog-post-page';
import { blogSlugs, findPost } from '@/data/blog-posts';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) =>
    blogSlugs.map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  return blogPostMetadata(toLang(lang), slug);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!findPost(slug)) notFound();
  return <BlogPostPage lang={toLang(lang)} slug={slug} />;
}
