/** Копия полосы доверия под первым экраном. Один файл на секцию — три языка рядом. */
export const trustRow = {
  ru: {
    protocol: 'IMAP → IMAP',
    sourceKept: 'Источник не удаляется',
    imapsync: 'На базе imapsync',
    free: 'Бесплатно без регистрации',
  },
  en: {
    protocol: 'IMAP → IMAP',
    sourceKept: 'Source is never deleted',
    imapsync: 'Built on imapsync',
    free: 'Free, no sign-up',
  },
  uk: {
    protocol: 'IMAP → IMAP',
    sourceKept: 'Джерело не видаляється',
    imapsync: 'На базі imapsync',
    free: 'Безкоштовно без реєстрації',
  },
} as const;
