import type { MetadataRoute } from 'next';
import { migrationRoutes } from '@/data/migration-routes';
import { providerHubSlugs } from '@/data/provider-hubs';
import { guideArticleSlugs } from '@/data/guide-articles';
import { imapHostSlugs } from '@/data/imap-hosts';
import { imapErrorSlugs } from '@/data/imap-errors';
import { blogPosts } from '@/data/blog-posts';
import { LANGS, href } from '@/i18n/config';
import { SITE } from '@/lib/seo';

/** Экспортируется как статический файл при output: 'export'. */
export const dynamic = 'force-static';

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]['changeFrequency']
>;

type Entry = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  /** Дата последнего изменения содержимого страницы, ISO. */
  lastModified: string;
};

/**
 * Дата последней правки текстов сайта.
 *
 * Раньше в lastmod уходила дата сборки, то есть после каждого деплоя все
 * страницы объявляли себя изменёнными — включая те, которых правка не
 * касалась. Поисковик такой lastmod быстро перестаёт учитывать вовсе.
 * Поэтому дата статическая: её двигают тем же коммитом, что меняет тексты
 * соответствующих страниц. У записей блога своя дата — из самой записи.
 */
const CONTENT_UPDATED = '2026-09-12';

/**
 * В карте только те URL, которые реально отдаются 200.
 * /privacy и /terms здесь с сентября 2026: реквизиты в них заполнены,
 * noindex снят. Приоритет низкий — это не посадочные страницы, но и
 * прятать их от поиска больше нет причины.
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
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
].map((page) => ({ ...page, lastModified: CONTENT_UPDATED }) as Entry);

const routePages: Entry[] = migrationRoutes.map((route) => ({
  path: `/migrate/${route.slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: route.tier === 1 ? 0.86 : 0.74,
  lastModified: CONTENT_UPDATED,
}));

/* Страницы провайдеров: точка входа по запросу про один сервис.
   Приоритет как у маршрутов первого эшелона — по ним приходит основной спрос. */
const hubPages: Entry[] = providerHubSlugs.map((slug) => ({
  path: `/migrate/${slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.86,
  lastModified: CONTENT_UPDATED,
}));

/* Отдельные гайды: разбор одной технической темы. Спрос ниже, чем у
   страниц провайдеров, но запросы точные — «imap 993 или 143». */
const guidePages: Entry[] = guideArticleSlugs.map((slug) => ({
  path: `/guides/${slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.72,
  lastModified: CONTENT_UPDATED,
}));

/* Настройки IMAP по сервисам. Запрос «хост и порт такого-то сервиса» люди
   задают постоянно и независимо от переезда — это самый широкий вход в
   раздел, поэтому приоритет на уровне гайдов провайдеров.

   Своя дата: раздел появился позже остальных текстов, и ставить ему общую
   дату значит соврать в обе стороны сразу. */
const IMAP_SECTION_UPDATED = '2026-09-15';

const imapHostPages: Entry[] = imapHostSlugs.map((slug) => ({
  path: `/imap/${slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.78,
  lastModified: IMAP_SECTION_UPDATED,
}));

imapHostPages.unshift({
  path: '/imap',
  changeFrequency: 'weekly',
  priority: 0.82,
  lastModified: IMAP_SECTION_UPDATED,
});

const errorPages: Entry[] = imapErrorSlugs.map((slug) => ({
  path: `/docs/errors/${slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.75,
  lastModified: CONTENT_UPDATED,
}));

/**
 * Каждая запись несёт взаимные hreflang: без них три языковые версии
 * конкурируют за один запрос, и поисковик сам решает, какую показать.
 * Обычно не ту.
 */
const blogPages: Entry[] = blogPosts.map((post) => ({
  path: `/blog/${post.slug}`,
  changeFrequency: 'monthly' as ChangeFrequency,
  priority: 0.68,
  lastModified: post.date,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const all = [
    ...pages,
    ...routePages,
    ...hubPages,
    ...guidePages,
    ...imapHostPages,
    ...errorPages,
    ...blogPages,
  ];

  return all.flatMap((page) => {
    const languages: Record<string, string> = {
      /* Тот же x-default, что в метаданных страниц: английская версия.
         Расхождение между sitemap и <link rel="alternate"> поисковик
         трактует как ошибку разметки и может проигнорировать обе. */
      'x-default': `${SITE}${href('en', page.path)}`,
    };
    for (const lang of LANGS) languages[lang] = `${SITE}${href(lang, page.path)}`;

    return LANGS.map((lang) => ({
      url: `${SITE}${href(lang, page.path)}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      /* Приоритеты у трёх версий равные: русская больше не главная.
         Английская и украинская — основные рынки, русская идёт наравне. */
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
