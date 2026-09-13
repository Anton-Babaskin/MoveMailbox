/**
 * Справочник IMAP-провайдеров.
 * Единый источник правды для маршрутов, гайдов и подстановки в форму.
 */

export type ProviderKey =
  | 'gmail'
  | 'google-workspace'
  | 'microsoft-365'
  | 'outlook'
  | 'yahoo'
  | 'icloud'
  | 'yandex'
  | 'mailru'
  | 'zoho'
  | 'cpanel'
  | 'exchange';

export type Provider = {
  key: ProviderKey;
  /** Отображаемое имя — используется в H1 и title маршрутов. */
  name: string;
  /** Короткое имя для слагов и хлебных крошек. */
  short: string;
  host: string;
  port: 993;
  security: 'tls';
  /** Формат логина: полный адрес или локальная часть. */
  login: 'email' | 'local';
  /** Нужен ли пароль приложения вместо обычного. */
  appPassword: boolean;
  /** Поддерживает ли OAuth 2.0 (XOAUTH2). */
  oauth: boolean;
  /** Практический потолок скорости выгрузки, МБ/час. Для калькулятора. */
  rateMbPerHour: number;
  /** Слаг гайда в /docs/providers/, если он есть. */
  guide?: string;
  /** Папки, которые почти всегда исключают. */
  excludeFolders?: string[];
  /** Почтовые домены, по которым провайдер узнаётся из логина. */
  domains?: string[];
};

export const providers: Record<ProviderKey, Provider> = {
  gmail: {
    key: 'gmail',
    name: 'Gmail',
    short: 'Gmail',
    host: 'imap.gmail.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 104,
    guide: 'gmail',
    excludeFolders: ['[Gmail]/All Mail', '[Gmail]/Spam', '[Gmail]/Trash'],
    domains: ['gmail.com', 'googlemail.com'],
  },
  'google-workspace': {
    key: 'google-workspace',
    name: 'Google Workspace',
    short: 'Workspace',
    host: 'imap.gmail.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 104,
    guide: 'gmail',
    excludeFolders: ['[Gmail]/All Mail', '[Gmail]/Spam'],
  },
  'microsoft-365': {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    short: 'Microsoft 365',
    host: 'outlook.office365.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: true,
    rateMbPerHour: 520,
    guide: 'microsoft-365',
    domains: ['onmicrosoft.com'],
  },
  outlook: {
    key: 'outlook',
    name: 'Outlook.com',
    short: 'Outlook',
    host: 'outlook.office365.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 520,
    guide: 'microsoft-365',
    excludeFolders: ['Junk'],
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
  },
  yahoo: {
    key: 'yahoo',
    name: 'Yahoo Mail',
    short: 'Yahoo',
    host: 'imap.mail.yahoo.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 700,
    domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com'],
  },
  icloud: {
    key: 'icloud',
    name: 'iCloud Mail',
    short: 'iCloud',
    host: 'imap.mail.me.com',
    port: 993,
    security: 'tls',
    login: 'local',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 820,
    domains: ['icloud.com', 'me.com', 'mac.com'],
  },
  yandex: {
    key: 'yandex',
    name: 'Яндекс.Почта',
    short: 'Яндекс',
    host: 'imap.yandex.ru',
    port: 993,
    security: 'tls',
    login: 'local',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 1450,
    guide: 'yandex',
    domains: ['yandex.ru', 'yandex.com', 'yandex.ua', 'ya.ru'],
  },
  mailru: {
    key: 'mailru',
    name: 'Mail.ru',
    short: 'Mail.ru',
    host: 'imap.mail.ru',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 1100,
    domains: ['mail.ru', 'inbox.ru', 'bk.ru', 'list.ru', 'internet.ru'],
  },
  zoho: {
    key: 'zoho',
    name: 'Zoho Mail',
    short: 'Zoho',
    host: 'imap.zoho.eu',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 1200,
    domains: ['zoho.com', 'zoho.eu', 'zohomail.com'],
  },
  cpanel: {
    key: 'cpanel',
    name: 'cPanel / Dovecot',
    short: 'cPanel',
    host: 'mail.example.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: false,
    rateMbPerHour: 4600,
  },
  exchange: {
    key: 'exchange',
    name: 'Exchange Server',
    short: 'Exchange',
    host: 'mail.example.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: false,
    rateMbPerHour: 3200,
  },
};

export function provider(key: ProviderKey): Provider {
  return providers[key];
}

/**
 * Порядок пресетов в форме. Первыми — те, ради которых сюда приходят из
 * поиска; последними — «любой IMAP» варианты, где адрес всё равно свой.
 */
export const presetOrder: ProviderKey[] = [
  'gmail',
  'google-workspace',
  'microsoft-365',
  'outlook',
  'yahoo',
  'icloud',
  'yandex',
  'mailru',
  'zoho',
  'cpanel',
  'exchange',
];

/**
 * Провайдер по адресу почты. Нужен, чтобы форма подставляла сервер и порт
 * сама: человек вводит логин, а не читает документацию про IMAP.
 * Корпоративный домен так не узнаётся — там остаётся ручной ввод.
 */
export function providerByEmail(email: string): Provider | null {
  const at = String(email).lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return null;
  for (const key of presetOrder) {
    const found = providers[key];
    if (found.domains?.some((d) => domain === d || domain.endsWith('.' + d))) return found;
  }
  return null;
}
