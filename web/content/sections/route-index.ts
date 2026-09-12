/** Копия индекса маршрутов. Один файл на секцию — три языка рядом. */
export const routeIndex = {
  ru: {
    eyebrow: 'Все направления',
    h2a: 'Подробный разбор ',
    h2b: 'для каждой пары',
    lede: 'Хосты, порты, пароли приложений и то, что ломается именно на этой паре — по одной странице на маршрут.',
  },
  en: {
    eyebrow: 'All routes',
    h2a: 'A detailed walkthrough ',
    h2b: 'for every pair',
    lede: 'Hosts, ports, app passwords and what breaks on this particular pair — one page per route.',
  },
  uk: {
    eyebrow: 'Усі напрямки',
    h2a: 'Докладний розбір ',
    h2b: 'для кожної пари',
    lede: 'Хости, порти, паролі застосунків і те, що ламається саме на цій парі — по одній сторінці на маршрут.',
  },
} as const;
