/**
 * Копия секции «Блог»: только обвязка индекса.
 *
 * Анонсы записей берутся из самих записей (data/blog-posts.ts) — иначе
 * заголовок карточки и заголовок статьи расходятся при первой же правке.
 */
export const blog = {
  ru: {
    eyebrow: 'Блог',
    h2a: 'Разборы миграций, ',
    h2b: 'граблей и провайдеров.',
    lede: 'Пишем о том, что реально ломается при переносе почты: новые ограничения провайдеров, аутентификация, доставляемость после переезда, свой почтовый сервер.',
    read: 'Читать',
  },
  en: {
    eyebrow: 'Blog',
    h2a: 'Migration write-ups, ',
    h2b: 'pitfalls and providers.',
    lede: 'We write about what actually breaks when mail moves: new provider limits, authentication, deliverability after the move, running your own mail server.',
    read: 'Read',
  },
  uk: {
    eyebrow: 'Блог',
    h2a: 'Розбори міграцій, ',
    h2b: 'граблів і провайдерів.',
    lede: 'Пишемо про те, що справді ламається під час перенесення пошти: нові обмеження провайдерів, автентифікація, доставність після переїзду, власний поштовий сервер.',
    read: 'Читати',
  },
} as const;
