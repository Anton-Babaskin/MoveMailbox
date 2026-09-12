import { notFound } from 'next/navigation';
import { BlogPostPage, blogPostMetadata } from '@/components/blog-post-page';
import { blogSlugs, findPost } from '@/data/blog-posts';

export const dynamicParams = false;

export function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return blogPostMetadata('ru', slug);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!findPost(slug)) notFound();
  return <BlogPostPage lang="ru" slug={slug} />;
}
