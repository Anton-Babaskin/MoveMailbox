/** Копия секции «Справочник провайдеров». Один файл на секцию — три языка рядом.
 * Содержимое панелей (шаги, подводные камни, команды) лежит в guides-runtime.ts. */
export const providerGuides = {
  ru: {
    eyebrow: 'Справочник провайдеров',
    h2a: 'Настройки провайдеров ',
    h2b: 'и подводные камни.',
    lede: 'Хост, порт, где взять пароль приложения и что провайдер делает не так, как вы ожидаете. Собрано то, из-за чего перенос ломается на первой минуте.',
    navLabel: 'Провайдеры',
    tabs: {
      gmail: { alt: 'Gmail', letter: 'G', name: 'Gmail' },
      m365: { alt: 'Microsoft 365', letter: 'M', name: 'Microsoft 365' },
      outlook: { alt: 'Outlook.com', letter: 'O', name: 'Outlook.com' },
      yandex: { alt: 'Яндекс.Почта', letter: 'Я', name: 'Яндекс.Почта' },
      icloud: { alt: 'iCloud Mail', letter: 'i', name: 'iCloud Mail' },
      zoho: { alt: 'Zoho Mail', letter: 'Z', name: 'Zoho Mail' },
      cpanel: { alt: 'cPanel / Dovecot', letter: 'cP', name: 'cPanel / Dovecot' },
    },
  },
  en: {
    eyebrow: 'Provider reference',
    h2a: 'Provider settings ',
    h2b: 'and the gotchas.',
    lede: 'Host, port, where to get an app password and what the provider does differently from what you expect. Everything here is what breaks a transfer in the first minute.',
    navLabel: 'Providers',
    tabs: {
      gmail: { alt: 'Gmail', letter: 'G', name: 'Gmail' },
      m365: { alt: 'Microsoft 365', letter: 'M', name: 'Microsoft 365' },
      outlook: { alt: 'Outlook.com', letter: 'O', name: 'Outlook.com' },
      yandex: { alt: 'Yandex Mail', letter: 'Y', name: 'Yandex Mail' },
      icloud: { alt: 'iCloud Mail', letter: 'i', name: 'iCloud Mail' },
      zoho: { alt: 'Zoho Mail', letter: 'Z', name: 'Zoho Mail' },
      cpanel: { alt: 'cPanel / Dovecot', letter: 'cP', name: 'cPanel / Dovecot' },
    },
  },
  uk: {
    eyebrow: 'Довідник провайдерів',
    h2a: 'Налаштування провайдерів ',
    h2b: 'і підводні камені.',
    lede: 'Хост, порт, де взяти пароль застосунку і що провайдер робить не так, як ви очікуєте. Зібрано те, через що перенесення ламається на першій хвилині.',
    navLabel: 'Провайдери',
    tabs: {
      gmail: { alt: 'Gmail', letter: 'G', name: 'Gmail' },
      m365: { alt: 'Microsoft 365', letter: 'M', name: 'Microsoft 365' },
      outlook: { alt: 'Outlook.com', letter: 'O', name: 'Outlook.com' },
      yandex: { alt: 'Яндекс.Пошта', letter: 'Я', name: 'Яндекс.Пошта' },
      icloud: { alt: 'iCloud Mail', letter: 'i', name: 'iCloud Mail' },
      zoho: { alt: 'Zoho Mail', letter: 'Z', name: 'Zoho Mail' },
      cpanel: { alt: 'cPanel / Dovecot', letter: 'cP', name: 'cPanel / Dovecot' },
    },
  },
} as const;
