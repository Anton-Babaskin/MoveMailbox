/** Строки, которые подставляет императивный код калькулятора (lib/calculator.ts):
 * единицы времени и объёма, названия источников, их ограничения и тарифы.
 * Разметка секции переведена отдельно — в calculator.ts.
 *
 * `sources` — словарь по значению data-n у кнопки: разметка не меняется между
 * языками, поэтому ключ везде русский, а подпись и ограничение берутся отсюда.
 *
 * Числительные: `pluralRule` выбирает правило склонения, `days` — формы.
 * Для 'slavic' форм три (день / дня / дней), для 'english' две (day / days). */
export const calculatorRuntime = {
  ru: {
    numberLocale: 'ru-RU',
    pluralRule: 'slavic',
    days: ['день', 'дня', 'дней'],
    minutes: 'мин',
    hours: 'ч',
    gb: 'ГБ',
    gbPerHour: 'ГБ/ч',
    mbPerHour: 'МБ/ч',
    planFree: 'Free · $0',
    planStandard: 'Standard · $5.90',
    planLarge: 'Large · $11.90',
    planBusiness: 'Business · по запросу',
    notePrefix: 'Ограничение: ',
    noteTail:
      '. Оценка, а не гарантия — мелкие письма едут медленнее крупных, накладные расходы на каждое сообщение одинаковы.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'суточный лимит выгрузки ~2.5 ГБ' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'троттлинг Exchange Online при активной записи' },
      'Яндекс.Почта': { name: 'Яндекс.Почта', note: 'ограничение частоты запросов, рвёт частые сессии' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'низкий лимит одновременных подключений' },
      'свой IMAP-сервер': { name: 'свой IMAP-сервер', note: 'упирается в канал, а не в лимиты провайдера' },
    },
  },
  en: {
    numberLocale: 'en-US',
    pluralRule: 'english',
    days: ['day', 'days'],
    minutes: 'min',
    hours: 'h',
    gb: 'GB',
    gbPerHour: 'GB/h',
    mbPerHour: 'MB/h',
    planFree: 'Free · $0',
    planStandard: 'Standard · $5.90',
    planLarge: 'Large · $11.90',
    planBusiness: 'Business · on request',
    notePrefix: 'Limit: ',
    noteTail:
      '. An estimate, not a guarantee — small messages move slower than large ones, the per-message overhead is the same either way.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'daily export cap of about 2.5 GB' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Exchange Online throttling under heavy writes' },
      'Яндекс.Почта': { name: 'Yandex Mail', note: 'request-rate limit, drops sessions that hammer it' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'low cap on simultaneous connections' },
      'свой IMAP-сервер': { name: 'your own IMAP server', note: 'bound by your connection, not by provider limits' },
    },
  },
  uk: {
    numberLocale: 'uk-UA',
    pluralRule: 'slavic',
    days: ['день', 'дні', 'днів'],
    minutes: 'хв',
    hours: 'год',
    gb: 'ГБ',
    gbPerHour: 'ГБ/год',
    mbPerHour: 'МБ/год',
    planFree: 'Free · $0',
    planStandard: 'Standard · $5.90',
    planLarge: 'Large · $11.90',
    planBusiness: 'Business · на запит',
    notePrefix: 'Обмеження: ',
    noteTail:
      '. Оцінка, а не гарантія — дрібні листи їдуть повільніше за великі, накладні витрати на кожен лист однакові.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'добовий ліміт вивантаження ~2.5 ГБ' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'тротлінг Exchange Online при активному записі' },
      'Яндекс.Почта': { name: 'Яндекс.Пошта', note: 'обмеження частоти запитів, рве часті сесії' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'низький ліміт одночасних підключень' },
      'свой IMAP-сервер': { name: 'власний IMAP-сервер', note: 'упирається в канал, а не в ліміти провайдера' },
    },
  },
} as const;
