/** Копия индекса ошибок IMAP. Один файл на секцию — три языка рядом. */
export const errorIndex = {
  ru: {
    eyebrow: 'Разбор по ошибкам',
    h2a: 'Ответ сервера ',
    h2b: 'и что с ним делать',
  },
  en: {
    eyebrow: 'Errors explained',
    h2a: 'What the server answered ',
    h2b: 'and what to do about it',
  },
  uk: {
    eyebrow: 'Розбір за помилками',
    h2a: 'Відповідь сервера ',
    h2b: 'і що з нею робити',
  },
} as const;
