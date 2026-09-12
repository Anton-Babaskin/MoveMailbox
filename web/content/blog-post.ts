/** Обвязка страницы записи блога: всё, что не сам текст статьи. */
export const blogPost = {
  ru: {
    home: 'Главная',
    blog: 'Блог',
    eyebrow: 'Разбор',
    minutes: 'мин чтения',
    published: 'Опубликовано',
    faqEyebrow: 'FAQ',
    faqTitle: 'Частые вопросы',
    linksTitle: 'Куда дальше',
    cta: 'Перенести почту в MoveMailbox',
    others: 'Другие записи',
  },
  en: {
    home: 'Home',
    blog: 'Blog',
    eyebrow: 'Write-up',
    minutes: 'min read',
    published: 'Published',
    faqEyebrow: 'FAQ',
    faqTitle: 'Common questions',
    linksTitle: 'Where to next',
    cta: 'Move your mail with MoveMailbox',
    others: 'More posts',
  },
  uk: {
    home: 'Головна',
    blog: 'Блог',
    eyebrow: 'Розбір',
    minutes: 'хв читання',
    published: 'Опубліковано',
    faqEyebrow: 'FAQ',
    faqTitle: 'Часті запитання',
    linksTitle: 'Куди далі',
    cta: 'Перенести пошту в MoveMailbox',
    others: 'Інші записи',
  },
} as const;

/** Даты в локальном формате: en — 12 Sep 2026, ru и uk — 12.09.2026. */
export const dateLocale = { ru: 'ru-RU', en: 'en-GB', uk: 'uk-UA' } as const;
