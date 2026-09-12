/**
 * Подсказка «страница есть на вашем языке».
 *
 * Текст всегда на том языке, который предлагаем: человеку, у которого система
 * английская, бесполезно объяснять по-русски, что есть английская версия.
 */
export const langSuggest = {
  en: {
    title: 'This page is available in English',
    action: 'Switch to English',
    dismiss: 'Stay in Russian',
    close: 'Close',
  },
  uk: {
    title: 'Ця сторінка є українською',
    action: 'Перейти на українську',
    dismiss: 'Залишитись російською',
    close: 'Закрити',
  },
  ru: {
    title: 'Эта страница есть на русском',
    action: 'Перейти на русский',
    dismiss: 'Остаться как есть',
    close: 'Закрыть',
  },
} as const;
