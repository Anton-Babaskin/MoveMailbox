/** Копия ленты под первым экраном. Один файл на секцию — три языка рядом.
 *  label — название группы для скринридера: без него бегущая строка
 *  объявляется как безымянный набор ссылок. */
export const trustRow = {
  ru: {
    label: 'Поддерживаемые сервисы',
    sourceKept: 'Источник не удаляется',
    imapsync: 'На базе imapsync',
    free: 'Бесплатно без регистрации',
  },
  en: {
    label: 'Supported services',
    sourceKept: 'Source is never deleted',
    imapsync: 'Built on imapsync',
    free: 'Free, no sign-up',
  },
  uk: {
    label: 'Підтримувані сервіси',
    sourceKept: 'Джерело не видаляється',
    imapsync: 'На базі imapsync',
    free: 'Безкоштовно без реєстрації',
  },
} as const;
