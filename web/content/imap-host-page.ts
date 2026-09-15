import type { Lang } from '@/i18n/config';

/**
 * Разметка раздела «Настройки IMAP» на трёх языках.
 *
 * Тексты самих сервисов лежат в data/imap-hosts.ts — здесь только подписи
 * шаблона: заголовки блоков, названия строк таблицы и подводка к ссылке на
 * источник. Их видно на каждой странице раздела, поэтому они нейтральные и
 * не пересказывают содержание конкретного сервиса.
 */
export const imapHostPage: Record<
  Lang,
  {
    eyebrow: string;
    home: string;
    indexTitle: string;
    settingsTitle: string;
    smtpTitle: string;
    rowServer: string;
    rowPort: string;
    rowSecurity: string;
    rowLogin: string;
    rowPassword: string;
    loginEmail: string;
    loginLocal: string;
    passwordPlain: string;
    passwordApp: string;
    passwordBridge: string;
    exportTitle: string;
    exportText: (host: string) => string;
    noImapTitle: string;
    checkedNote: (date: string) => string;
    checkedNoteDocs: (date: string) => string;
    sourceLabel: string;
    pitfallsA: string;
    pitfallsB: string;
    faqEyebrow: string;
    faqTitle: string;
    cta: (name: string) => string;
    allHosts: string;
    guides: string;
    errors: string;
  }
> = {
  ru: {
    eyebrow: 'Настройки IMAP',
    home: 'Главная',
    indexTitle: 'Настройки IMAP по сервисам',
    settingsTitle: 'Подключение по IMAP',
    smtpTitle: 'Отправка, SMTP',
    rowServer: 'Сервер',
    rowPort: 'Порт',
    rowSecurity: 'Шифрование',
    rowLogin: 'Логин',
    rowPassword: 'Пароль',
    loginEmail: 'полный адрес',
    loginLocal: 'часть адреса до собаки',
    passwordPlain: 'обычный пароль ящика',
    passwordApp: 'пароль приложения',
    passwordBridge: 'пароль из Bridge',
    exportTitle: 'Хост для полной выгрузки',
    exportText: (host) =>
      `Для выгрузки ящика целиком сервис называет отдельный адрес — ${host}, порт и шифрование те же. Он рассчитан на массовое чтение, а не на повседневную синхронизацию.`,
    noImapTitle: 'Прямого IMAP нет',
    checkedNote: (date) =>
      `Значения сверены с файлом автоконфигурации сервиса ${date}. Это тот же источник, откуда настройки берёт Thunderbird.`,
    checkedNoteDocs: (date) =>
      `Значения сверены с документацией самого сервиса ${date}: файла автоконфигурации у него нет.`,
    sourceLabel: 'Источник',
    pitfallsA: 'Что здесь ',
    pitfallsB: 'ломается.',
    faqEyebrow: 'Вопросы',
    faqTitle: 'Коротко о частом',
    cta: (name) => `Перенести почту ${name}`,
    allHosts: 'Все настройки IMAP',
    guides: 'Гайды по провайдерам',
    errors: 'Справочник ошибок IMAP',
  },
  en: {
    eyebrow: 'IMAP settings',
    home: 'Home',
    indexTitle: 'IMAP settings by service',
    settingsTitle: 'IMAP connection',
    smtpTitle: 'Sending, SMTP',
    rowServer: 'Server',
    rowPort: 'Port',
    rowSecurity: 'Encryption',
    rowLogin: 'Username',
    rowPassword: 'Password',
    loginEmail: 'full address',
    loginLocal: 'the part before the @',
    passwordPlain: 'the mailbox password',
    passwordApp: 'app password',
    passwordBridge: 'the password from Bridge',
    exportTitle: 'Host for a full download',
    exportText: (host) =>
      `For pulling an entire mailbox the service names a separate address — ${host}, same port and encryption. It is meant for bulk reads rather than day-to-day sync.`,
    noImapTitle: 'No direct IMAP',
    checkedNote: (date) =>
      `Checked against the service's own autoconfiguration file on ${date} — the same source Thunderbird reads when it fills the settings in for you.`,
    checkedNoteDocs: (date) =>
      `Checked against the service's own documentation on ${date}: it publishes no autoconfiguration file.`,
    sourceLabel: 'Source',
    pitfallsA: 'What breaks ',
    pitfallsB: 'here.',
    faqEyebrow: 'Questions',
    faqTitle: 'The short answers',
    cta: (name) => `Migrate a ${name} mailbox`,
    allHosts: 'All IMAP settings',
    guides: 'Provider guides',
    errors: 'IMAP error reference',
  },
  uk: {
    eyebrow: 'Налаштування IMAP',
    home: 'Головна',
    indexTitle: 'Налаштування IMAP за сервісами',
    settingsTitle: 'Підключення за IMAP',
    smtpTitle: 'Надсилання, SMTP',
    rowServer: 'Сервер',
    rowPort: 'Порт',
    rowSecurity: 'Шифрування',
    rowLogin: 'Логін',
    rowPassword: 'Пароль',
    loginEmail: 'повна адреса',
    loginLocal: 'частина адреси до равлика',
    passwordPlain: 'звичайний пароль скриньки',
    passwordApp: 'пароль застосунку',
    passwordBridge: 'пароль із Bridge',
    exportTitle: 'Хост для повного вивантаження',
    exportText: (host) =>
      `Для вивантаження скриньки цілком сервіс називає окрему адресу — ${host}, порт і шифрування ті самі. Він розрахований на масове читання, а не на щоденну синхронізацію.`,
    noImapTitle: 'Прямого IMAP немає',
    checkedNote: (date) =>
      `Значення звірені з файлом автоконфігурації сервісу ${date}. Це те саме джерело, звідки налаштування бере Thunderbird.`,
    checkedNoteDocs: (date) =>
      `Значення звірені з документацією самого сервісу ${date}: файла автоконфігурації в нього немає.`,
    sourceLabel: 'Джерело',
    pitfallsA: 'Що тут ',
    pitfallsB: 'ламається.',
    faqEyebrow: 'Питання',
    faqTitle: 'Коротко про часте',
    cta: (name) => `Перенести пошту ${name}`,
    allHosts: 'Усі налаштування IMAP',
    guides: 'Гайди за провайдерами',
    errors: 'Довідник помилок IMAP',
  },
};

/** Подписи витрины раздела: /imap. */
export const imapIndexPage: Record<
  Lang,
  { eyebrow: string; h1: string; lede: string; tableNote: string }
> = {
  ru: {
    eyebrow: 'Справочник',
    h1: 'Настройки IMAP по сервисам',
    lede:
      'Хост, порт, шифрование и вид пароля для каждого почтового сервиса — и то, из-за чего подключение обычно не выходит с первого раза. Значения взяты из автоконфигурации и документации самих сервисов, а не из чужих обзоров.',
    tableNote: 'Сервер и порт для подключения по IMAP',
  },
  en: {
    eyebrow: 'Reference',
    h1: 'IMAP settings by service',
    lede:
      'Host, port, encryption and which kind of password each mail service wants — plus the thing that usually stops the first attempt. Values come from the services\' own autoconfiguration files and documentation, not from second-hand write-ups.',
    tableNote: 'Server and port for the IMAP connection',
  },
  uk: {
    eyebrow: 'Довідник',
    h1: 'Налаштування IMAP за сервісами',
    lede:
      'Хост, порт, шифрування та вид пароля для кожного поштового сервісу — і те, через що підключення зазвичай не виходить з першого разу. Значення взяті з автоконфігурації та документації самих сервісів, а не з чужих оглядів.',
    tableNote: 'Сервер і порт для підключення за IMAP',
  },
};
