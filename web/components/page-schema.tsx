import { JsonLd } from '@/components/json-ld';
import { pages } from '@/content/pages';
import { guideArticlePage } from '@/content/guide-article-page';
import { breadcrumbLd, organizationLd, softwareLd, webPageLd, webSiteLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';

/**
 * Разметка для страниц, у которых нет своей.
 *
 * Статьи, маршруты, гайды и страницы ошибок описывают себя сами — у них
 * есть BlogPosting, HowTo или TechArticle. А главная, витрины разделов и
 * служебные страницы не описывали себя ничем: тридцать адресов из ста
 * шестидесяти двух уходили в индекс вообще без структурированных данных.
 *
 * Названия берутся из того же словаря content/pages.ts, что и <title> с
 * описанием: разъехаться им негде по построению.
 *
 * kind определяет тип:
 *   home       — Organization, WebSite и SoftwareApplication;
 *   app        — SoftwareApplication с ценами: тарифы и загрузка;
 *   collection — витрина раздела: маршруты, гайды, блог, справочник ошибок;
 *   page       — обычная страница: безопасность, оферта, приватность.
 */
export function PageSchema({
  lang,
  path,
  kind,
}: {
  lang: Lang;
  /** Путь без языкового префикса, как в content/pages.ts: '' для главной. */
  path: string;
  kind: 'home' | 'app' | 'collection' | 'page';
}) {
  const meta = pages[path || '/']?.[lang];
  if (!meta) return null;

  const url = href(lang, path || '/');
  const home = guideArticlePage[lang].home;

  if (kind === 'home') {
    return (
      <JsonLd data={[organizationLd(), webSiteLd(lang), softwareLd(lang)]} />
    );
  }

  /* У всех остальных — хлебные крошки от главной: в выдаче это вторая
     строка сниппета вместо голого адреса. */
  const crumbs = breadcrumbLd([
    { name: home, path: href(lang, '/') },
    { name: meta.title.split(' — ')[0], path: url },
  ]);

  return (
    <JsonLd
      data={[
        crumbs,
        kind === 'app'
          ? softwareLd(lang)
          : webPageLd({
              name: meta.title,
              description: meta.description,
              path: url,
              lang,
              collection: kind === 'collection',
            }),
      ]}
    />
  );
}
