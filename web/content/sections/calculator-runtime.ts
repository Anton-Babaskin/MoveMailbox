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
    sideSource: 'отдаёт ',
    sideDestination: 'принимает ',
    notePrefix: 'Узкое место — ',
    noteTail:
      '. Оценка, а не гарантия: мелкие письма едут медленнее крупных, накладные расходы на каждое сообщение одинаковы.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'Gmail, задокументированный лимит выгрузки 2500 МБ в сутки' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, троттлинг Exchange Online — порогов компания не публикует, это наша оценка' },
      'Яндекс.Почта': { name: 'Яндекс.Почта', note: 'Яндекс, ограничение частоты запросов — наша оценка' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, низкий лимит одновременных подключений — наша оценка' },
      'свой IMAP-сервер': { name: 'свой IMAP-сервер', note: 'ваш сервер — упирается в канал, а не в лимиты провайдера' },
    },
    destinations: {
      'Gmail': { name: 'Gmail', note: 'Gmail, задокументированный лимит загрузки 500 МБ в сутки — впятеро строже, чем на выгрузку' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, троттлинг Exchange Online — порогов компания не публикует, это наша оценка' },
      'Яндекс.Почта': { name: 'Яндекс.Почта', note: 'Яндекс, ограничение частоты запросов — наша оценка' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, низкий лимит одновременных подключений — наша оценка' },
      'свой IMAP-сервер': { name: 'свой IMAP-сервер', note: 'ваш сервер — упирается в канал, а не в лимиты провайдера' },
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
    sideSource: 'the source — ',
    sideDestination: 'the destination — ',
    notePrefix: 'Bottleneck: ',
    noteTail:
      '. An estimate, not a guarantee — small messages move slower than large ones, the per-message overhead is the same either way.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'Gmail, a documented export cap of 2500 MB a day' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, Exchange Online throttling — Microsoft publishes no figure, this is our estimate' },
      'Яндекс.Почта': { name: 'Yandex Mail', note: 'Yandex, request-rate limiting — our estimate' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, a low cap on simultaneous connections — our estimate' },
      'свой IMAP-сервер': { name: 'your own IMAP server', note: 'your server — bound by your connection, not by provider limits' },
    },
    destinations: {
      'Gmail': { name: 'Gmail', note: 'Gmail, a documented import cap of 500 MB a day — five times stricter than its export cap' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, Exchange Online throttling — Microsoft publishes no figure, this is our estimate' },
      'Яндекс.Почта': { name: 'Yandex Mail', note: 'Yandex, request-rate limiting — our estimate' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, a low cap on simultaneous connections — our estimate' },
      'свой IMAP-сервер': { name: 'your own IMAP server', note: 'your server — bound by your connection, not by provider limits' },
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
    sideSource: 'віддає ',
    sideDestination: 'приймає ',
    notePrefix: 'Вузьке місце — ',
    noteTail:
      '. Оцінка, а не гарантія — дрібні листи їдуть повільніше за великі, накладні витрати на кожен лист однакові.',
    sources: {
      'Gmail': { name: 'Gmail', note: 'Gmail, задокументований ліміт вивантаження 2500 МБ на добу' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, тротлінг Exchange Online — порогів компанія не публікує, це наша оцінка' },
      'Яндекс.Почта': { name: 'Яндекс.Пошта', note: 'Яндекс, обмеження частоти запитів — наша оцінка' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, низький ліміт одночасних підключень — наша оцінка' },
      'свой IMAP-сервер': { name: 'власний IMAP-сервер', note: 'ваш сервер — упирається в канал, а не в ліміти провайдера' },
    },
    destinations: {
      'Gmail': { name: 'Gmail', note: 'Gmail, задокументований ліміт завантаження 500 МБ на добу — вп’ятеро суворіший за вивантаження' },
      'Microsoft 365': { name: 'Microsoft 365', note: 'Microsoft 365, тротлінг Exchange Online — порогів компанія не публікує, це наша оцінка' },
      'Яндекс.Почта': { name: 'Яндекс.Пошта', note: 'Яндекс, обмеження частоти запитів — наша оцінка' },
      'iCloud Mail': { name: 'iCloud Mail', note: 'iCloud, низький ліміт одночасних підключень — наша оцінка' },
      'свой IMAP-сервер': { name: 'власний IMAP-сервер', note: 'ваш сервер — упирається в канал, а не в ліміти провайдера' },
    },
  },
} as const;
