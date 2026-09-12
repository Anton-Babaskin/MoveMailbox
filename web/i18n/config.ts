/**
 * Языки сайта. Русский живёт в корне, остальные — под префиксом,
 * чтобы старые ссылки и накопленный индекс не переехали.
 */
export const LANGS = ['ru', 'en', 'uk'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'ru';

/** Языки, у которых есть префикс в пути: всё, кроме языка по умолчанию. */
export const PREFIXED_LANGS = LANGS.filter((l) => l !== DEFAULT_LANG);

/** '' для ru, '/en' и '/uk' для остальных. */
export function prefix(lang: Lang): string {
  return lang === DEFAULT_LANG ? '' : `/${lang}`;
}

/**
 * Абсолютный путь страницы в нужном языке: href('en', '/routes') → '/en/routes/'.
 *
 * Хвостовой слэш обязателен: при trailingSlash:true именно такой адрес
 * стоит в canonical и в sitemap, и именно его отдаёт GitHub Pages.
 * Ссылка без слэша даёт лишний редирект, а в JSON-LD — расхождение
 * с canonical, из-за которого разметка относится к «другой» странице.
 */
export function href(lang: Lang, path: string): string {
  const clean = path === '/' ? '' : path.replace(/\/+$/, '');
  const full = `${prefix(lang)}${clean}`;
  return full === '' ? '/' : `${full}/`;
}

/** Атрибут lang и locale для Open Graph. */
export const HTML_LANG: Record<Lang, string> = { ru: 'ru', en: 'en', uk: 'uk' };
export const OG_LOCALE: Record<Lang, string> = {
  ru: 'ru_RU',
  en: 'en_US',
  uk: 'uk_UA',
};

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Next генерирует типы роутов с `params: { lang: string }` — сузить их
 * в сигнатуре нельзя, поэтому сужаем значение здесь. Неизвестный язык
 * до страницы не доходит: dynamicParams = false, но тип об этом не знает.
 */
export function toLang(value: string): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}
