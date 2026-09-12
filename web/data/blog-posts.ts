/**
 * Записи блога.
 *
 * Блог существует не ради блога: каждая статья закрывает кластер из
 * docs/seo/semantic-core.csv, который не покрывается страницей маршрута
 * или ошибки, и ведёт на конкретную посадочную. Отсюда обязательное поле
 * links: статья без внутренней ссылки на маршрут или на форму — потерянный
 * трафик, и лучше поймать это типом, чем в отчёте через месяц.
 *
 * Текст каждой записи лежит отдельным файлом в content/blog: один файл на
 * статью, три языка рядом — как у секций и у страниц ошибок.
 */
import type { Lang } from '@/i18n/config';

import { appPasswords } from '@/content/blog/app-passwords';
import { corporateMailboxes } from '@/content/blog/corporate-mailboxes';
import { folderSeparators } from '@/content/blog/folder-separators';
import { gmailAllMailTrap } from '@/content/blog/gmail-all-mail-trap';
import { hostingChange } from '@/content/blog/hosting-change';
import { howLongMigrationTakes } from '@/content/blog/how-long-migration-takes';
import { imapVsPop3 } from '@/content/blog/imap-vs-pop3';
import { imapsyncWithoutCommandLine } from '@/content/blog/imapsync-without-command-line';
import { migrationInterrupted } from '@/content/blog/migration-interrupted';
import { oauthMicrosoft365 } from '@/content/blog/oauth-microsoft-365';
import { spamAfterMigration } from '@/content/blog/spam-after-migration';
import { verifyMigration } from '@/content/blog/verify-migration';

/** Блок текста внутри статьи. Заголовок обязателен, остальное по месту. */
export type BlogBlock = {
  h2: string;
  paragraphs: string[];
  /** Маркированный список: причины, признаки, варианты. */
  bullets?: string[];
  /** Нумерованный список: порядок действий. */
  steps?: string[];
  /** Пример из журнала или команда — идёт в <pre> с подписью. */
  sample?: { caption: string; body: string };
};

export type BlogCopy = {
  /** До 60 символов вместе с брендом. */
  title: string;
  /** До 155 символов и обязательно свой у каждого языка. */
  description: string;
  h1: string;
  lede: string;
  /** Рубрика на карточке в индексе. */
  tag: string;
  /** Аннотация на карточке: короче lede, другими словами. */
  card: string;
  blocks: BlogBlock[];
  faq: Array<[string, string]>;
  /**
   * Внутренние ссылки в конце статьи. Путь без языкового префикса —
   * язык подставит href(lang, path).
   */
  links: Array<{ path: string; label: string }>;
};

export type BlogPost = {
  /** Слаг URL: /blog/<slug> */
  slug: string;
  /** Дата публикации в ISO. Идёт в datePublished разметки BlogPosting. */
  date: string;
  /** Идентификатор иконки в спрайте — обложка карточки. */
  icon: string;
  ru: BlogCopy;
  en: BlogCopy;
  uk: BlogCopy;
};

/** Порядок здесь — порядок в индексе блога и в карте сайта. */
export const blogPosts: BlogPost[] = [
  appPasswords,
  howLongMigrationTakes,
  gmailAllMailTrap,
  hostingChange,
  corporateMailboxes,
  imapsyncWithoutCommandLine,
  migrationInterrupted,
  imapVsPop3,
  verifyMigration,
  folderSeparators,
  oauthMicrosoft365,
  spamAfterMigration,
];

export const blogSlugs = blogPosts.map((post) => post.slug);

export function findPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

/**
 * Время чтения считается из самого текста, а не проставляется руками:
 * цифра, разошедшаяся с объёмом после правки статьи, — мелкая, но
 * заметная неправда. 180 слов в минуту — консервативная оценка для
 * технического текста.
 */
export function readingMinutes(copy: BlogCopy): number {
  const text = [
    copy.lede,
    ...copy.blocks.flatMap((block) => [
      block.h2,
      ...block.paragraphs,
      ...(block.bullets ?? []),
      ...(block.steps ?? []),
    ]),
    ...copy.faq.flatMap(([question, answer]) => [question, answer]),
  ].join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 180));
}

export function postCopy(post: BlogPost, lang: Lang): BlogCopy {
  return post[lang];
}
