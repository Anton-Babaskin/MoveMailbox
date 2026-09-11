import type { MetadataRoute } from 'next';
import { migrationRoutes } from '@/data/migration-routes';
import { imapErrorSlugs } from '@/data/imap-errors';
import { SITE } from '@/lib/seo';

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]['changeFrequency']
>;

const base = SITE;

type Entry = { path: string; changeFrequency: ChangeFrequency; priority: number };

/**
 * В карте только те URL, которые реально отдаются 200.
 * Локали /en и /uk и страницы /privacy, /terms добавляются сюда
 * в тот же коммит, в котором появляются сами страницы: sitemap,
 * ведущий на 404, Search Console считает ошибкой.
 */
const pages: Entry[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/routes', changeFrequency: 'weekly', priority: 0.86 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.84 },
  { path: '/docs/errors', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.78 },
  { path: '/security', changeFrequency: 'monthly', priority: 0.7 },
];

const routePages: Entry[] = migrationRoutes.map((route) => ({
  path: `/migrate/${route.slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: route.tier === 1 ? 0.86 : 0.74,
}));

const errorPages: Entry[] = imapErrorSlugs.map((slug) => ({
  path: `/docs/errors/${slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.75,
}));

/** Экспортируется как статический файл при output: 'export'. */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [...pages, ...routePages, ...errorPages].map((page) => ({
    url: `${base}${page.path}/`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
