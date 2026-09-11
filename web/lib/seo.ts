import type { Metadata } from 'next';

export type Language = 'ru' | 'en' | 'uk';

export const SITE = 'https://movemailbox.com';
export const SITE_NAME = 'MoveMailbox';

/** Префикс языка в URL. Русский живёт в корне. */
export function langPrefix(language: Language): string {
  return language === 'ru' ? '' : `/${language}`;
}

/**
 * Единая сборка метаданных для любой страницы.
 *
 * Главное здесь — alternates: без взаимных hreflang три языковые версии
 * конкурируют друг с другом за один запрос, и Google сам решает, какую
 * показать. Обычно не ту.
 */
export function buildMetadata({
  language,
  path,
  title,
  description,
  image = '/og.png',
  index = true,
}: {
  language: Language;
  /** Путь без языкового префикса, например /migrate/gmail-to-outlook */
  path: string;
  title: string;
  description: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const prefix = langPrefix(language);
  const canonical = (`${prefix}${path}` || '/').replace(/\/?$/, '/');
  const locale =
    language === 'ru' ? 'ru_RU' : language === 'uk' ? 'uk_UA' : 'en_US';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'article',
      locale,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, width: 1735, height: 909, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

/** Хлебные крошки. Дают вторую строку в сниппете вместо голого URL. */
export function breadcrumbLd(
  items: Array<{ name: string; path: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`.replace(/\/?$/, '/'),
    })),
  };
}

/** FAQPage. Может дать раскрывающиеся вопросы прямо в выдаче. */
export function faqLd(faq: Array<[string, string]>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/** HowTo для маршрутных гайдов. */
export function howToLd({
  name,
  description,
  steps,
  totalTime = 'PT30M',
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  /** ISO 8601 duration. */
  totalTime?: string;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime,
    tool: [{ '@type': 'HowToTool', name: SITE_NAME }],
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/** SoftwareApplication для главной и страниц загрузки. */
export function softwareLd(language: Language): Json {
  const ru = language === 'ru';
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows, Linux, Docker, Web',
    description: ru
      ? 'Перенос почты между IMAP-серверами: онлайн до 5 ГБ бесплатно или локальный клиент без облачного лимита.'
      : 'Move mailboxes between IMAP servers: 5 GB free online, or a local client with no cloud limit.',
    url: SITE,
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: ru ? 'Free · до 5 ГБ' : 'Free · up to 5 GB',
      },
      {
        '@type': 'Offer',
        price: '5.90',
        priceCurrency: 'USD',
        name: ru ? 'Standard · до 25 ГБ' : 'Standard · up to 25 GB',
      },
      {
        '@type': 'Offer',
        price: '11.90',
        priceCurrency: 'USD',
        name: ru ? 'Large · до 100 ГБ' : 'Large · up to 100 GB',
      },
    ],
  };
}

/** TechArticle для страниц ошибок. */
export function techArticleLd({
  headline,
  description,
  path,
}: {
  headline: string;
  description: string;
  path: string;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url: `${SITE}${path}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE,
    },
  };
}
