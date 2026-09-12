/**
 * Страница 404.
 *
 * Экспорт кладёт её одним файлом 404.html на весь сайт — отдельной версии
 * для /en и /uk не существует. Поэтому разметка приходит на русском
 * (x-default), а язык подставляется на клиенте по префиксу адреса: человек,
 * пришедший по битой ссылке на /en/..., не должен упираться в русский текст.
 */
export const notFound = {
  ru: {
    eyebrow: '404',
    h1: 'Такой страницы нет',
    lede: 'Адрес набран с опечаткой или страница переехала. Почта при этом никуда не делась — вот основные разделы.',
    links: [
      { path: '/', label: 'Главная и форма переноса' },
      { path: '/routes', label: 'Маршруты переноса' },
      { path: '/guides', label: 'Настройки IMAP по провайдерам' },
      { path: '/docs/errors', label: 'Разборы ошибок IMAP' },
      { path: '/blog', label: 'Блог' },
    ],
  },
  en: {
    eyebrow: '404',
    h1: 'This page does not exist',
    lede: 'The address has a typo or the page has moved. Your mail is unaffected — here are the main sections.',
    links: [
      { path: '/', label: 'Home and the migration form' },
      { path: '/routes', label: 'Migration routes' },
      { path: '/guides', label: 'IMAP settings by provider' },
      { path: '/docs/errors', label: 'IMAP error write-ups' },
      { path: '/blog', label: 'Blog' },
    ],
  },
  uk: {
    eyebrow: '404',
    h1: 'Такої сторінки немає',
    lede: 'Адресу набрано з одруком або сторінка переїхала. Пошта при цьому нікуди не зникла — ось основні розділи.',
    links: [
      { path: '/', label: 'Головна і форма перенесення' },
      { path: '/routes', label: 'Маршрути перенесення' },
      { path: '/guides', label: 'Налаштування IMAP за провайдерами' },
      { path: '/docs/errors', label: 'Розбори помилок IMAP' },
      { path: '/blog', label: 'Блог' },
    ],
  },
} as const;
