import type { MetadataRoute } from 'next';
import { migrationRoutes } from '@/data/migration-routes';
import { imapErrorSlugs } from '@/data/imap-errors';
import { LANGS, href } from '@/i18n/config';
import { SITE } from '@/lib/seo';

/** Экспортируется как статический файл при output: 'export'. */
export const dynamic = 'force-static';

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]['changeFrequency']
>;

type Entry = { path: string; changeFrequency: ChangeFrequency; priority: number };

/**
 * В карте только те URL, которые реально отдаются 200.
 * /privacy и /terms сюда не идут намеренно: они под noindex,
 * пока в них не подставлены реквизиты.
 */
const pages: Entry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/routes', changeFrequency: 'weekly', priority: 0.86 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.84 },
  { path: '/docs/errors', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.78 },
  { path: '/security', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
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

/**
 * Каждая запись несёт взаимные hreflang: без них три языковые версии
 * конкурируют за один запрос, и поисковик сам решает, какую показать.
 * Обычно не ту.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const all = [...pages, ...routePages, ...errorPages];

  return all.flatMap((page) => {
    const languages: Record<string, string> = {
      'x-default': `${SITE}${href('ru', page.path)}`,
    };
    for (const lang of LANGS) languages[lang] = `${SITE}${href(lang, page.path)}`;

    return LANGS.map((lang) => ({
      url: `${SITE}${href(lang, page.path)}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority:
        lang === 'ru' ? page.priority : Math.max(0.1, page.priority - 0.05),
      alternates: { languages },
    }));
  });
}
